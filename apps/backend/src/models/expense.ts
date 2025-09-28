import { PrismaClient, Expense, ExpenseCategory, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  date?: Date;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseWithUser extends Expense {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class ExpenseModel {
  /**
   * Create a new expense
   */
  static async create(userId: string, data: CreateExpenseData): Promise<Expense> {
    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Validate date (cannot be future)
    if (data.date > new Date()) {
      throw new Error('Cannot create expense with future date');
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (data.description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }

    return await prisma.expense.create({
      data: {
        userId,
        amount: new Decimal(data.amount),
        category: data.category,
        description: data.description.trim(),
        date: data.date,
      },
    });
  }

  /**
   * Get expenses with role-based filtering
   */
  static async findMany(
    userId: string,
    userRole: string,
    familyId: string,
    filters: ExpenseFilters = {}
  ): Promise<{ expenses: ExpenseWithUser[]; total: number }> {
    const {
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {};

    if (userRole === 'CHILD') {
      // Children can only see their own expenses
      whereClause.userId = userId;
    } else {
      // Father and Mother can see all family expenses
      whereClause.user = {
        familyId: familyId,
      };
    }

    // Apply filters
    if (category) {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }

    if (search) {
      whereClause.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.expense.count({
        where: whereClause,
      }),
    ]);

    return { expenses, total };
  }

  /**
   * Get expense by ID with ownership check
   */
  static async findById(
    expenseId: string,
    userId: string,
    userRole: string,
    familyId: string
  ): Promise<ExpenseWithUser | null> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            familyId: true,
          },
        },
      },
    });

    if (!expense) {
      return null;
    }

    // Check ownership/access
    if (userRole === 'CHILD') {
      if (expense.userId !== userId) {
        throw new Error('Unauthorized: Cannot access this expense');
      }
    } else {
      // Father and Mother can access family expenses
      if (expense.user.familyId !== familyId) {
        throw new Error('Unauthorized: Cannot access this expense');
      }
    }

    return expense;
  }

  /**
   * Update expense with ownership check
   */
  static async update(
    expenseId: string,
    userId: string,
    userRole: string,
    familyId: string,
    data: UpdateExpenseData
  ): Promise<Expense> {
    // First check if expense exists and user has access
    const existingExpense = await this.findById(expenseId, userId, userRole, familyId);
    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    // Validate update data
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (data.date && data.date > new Date()) {
      throw new Error('Cannot set future date');
    }

    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        throw new Error('Description is required');
      }
      if (data.description.length > 500) {
        throw new Error('Description must be 500 characters or less');
      }
    }

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.date !== undefined) updateData.date = data.date;

    return await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });
  }

  /**
   * Delete expense (soft delete) with ownership check
   */
  static async delete(
    expenseId: string,
    userId: string,
    userRole: string,
    familyId: string
  ): Promise<void> {
    // First check if expense exists and user has access
    const existingExpense = await this.findById(expenseId, userId, userRole, familyId);
    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });
  }

  /**
   * Get expense analytics for dashboard
   */
  static async getAnalytics(
    userId: string,
    userRole: string,
    familyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    let whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userRole === 'CHILD') {
      whereClause.userId = userId;
    } else {
      whereClause.user = {
        familyId: familyId,
      };
    }

    const [expenses, categoryBreakdown] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const expenseCount = expenses.length;
    const averageAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;

    return {
      totalAmount,
      expenseCount,
      averageAmount,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
        percentage: totalAmount > 0 ? (Number(item._sum.amount || 0) / totalAmount) * 100 : 0,
      })),
    };
  }

  /**
   * Get expense categories
   */
  static getCategories(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'FOOD',
        label: 'Food & Dining',
        description: 'Groceries, restaurants, food delivery',
      },
      {
        value: 'TRANSPORT',
        label: 'Transportation',
        description: 'Gas, public transit, car maintenance',
      },
      {
        value: 'BILLS',
        label: 'Bills & Utilities',
        description: 'Rent, electricity, water, internet',
      },
      {
        value: 'EDUCATION',
        label: 'Education',
        description: 'School fees, books, courses',
      },
      {
        value: 'ENTERTAINMENT',
        label: 'Entertainment',
        description: 'Movies, games, subscriptions',
      },
      {
        value: 'HEALTHCARE',
        label: 'Healthcare',
        description: 'Medical expenses, pharmacy',
      },
      {
        value: 'SAVINGS',
        label: 'Savings',
        description: 'Emergency fund, investments',
      },
      {
        value: 'OTHER',
        label: 'Other',
        description: 'Miscellaneous expenses',
      },
    ];
  }
}
