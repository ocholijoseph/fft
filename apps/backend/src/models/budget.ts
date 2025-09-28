import { PrismaClient, Budget, ExpenseCategory, BudgetPeriod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CreateBudgetData {
  category: ExpenseCategory;
  amount: number;
  period: BudgetPeriod;
}

export interface UpdateBudgetData {
  amount?: number;
  period?: BudgetPeriod;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
}

export class BudgetModel {
  /**
   * Create a new budget (Father role only)
   */
  static async create(familyId: string, data: CreateBudgetData): Promise<Budget> {
    // Validate amount
    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Check if budget already exists for this category and period
    const existingBudget = await prisma.budget.findUnique({
      where: {
        familyId_category_period: {
          familyId,
          category: data.category,
          period: data.period,
        },
      },
    });

    if (existingBudget) {
      throw new Error(`Budget already exists for ${data.category} (${data.period})`);
    }

    return await prisma.budget.create({
      data: {
        familyId,
        category: data.category,
        amount: new Decimal(data.amount),
        period: data.period,
      },
    });
  }

  /**
   * Get family budgets with spending information
   */
  static async findMany(
    familyId: string,
    period?: BudgetPeriod,
    year?: number
  ): Promise<BudgetWithSpending[]> {
    const currentDate = new Date();
    const currentYear = year || currentDate.getFullYear();

    let whereClause: any = {
      familyId,
    };

    if (period) {
      whereClause.period = period;
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      orderBy: {
        category: 'asc',
      },
    });

    // Calculate spending for each budget
    const budgetsWithSpending: BudgetWithSpending[] = [];

    for (const budget of budgets) {
      const { startDate, endDate } = this.getBudgetPeriodDates(budget.period, currentYear);
      
      const spending = await this.calculateSpending(familyId, budget.category, startDate, endDate);
      
      const spent = Number(spending);
      const remaining = Number(budget.amount) - spent;
      const utilizationPercentage = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0;
      
      let status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED' = 'ON_TRACK';
      if (utilizationPercentage >= 100) {
        status = 'EXCEEDED';
      } else if (utilizationPercentage >= 80) {
        status = 'WARNING';
      }

      budgetsWithSpending.push({
        ...budget,
        spent,
        remaining,
        utilizationPercentage,
        status,
      });
    }

    return budgetsWithSpending;
  }

  /**
   * Get budget by ID
   */
  static async findById(budgetId: string, familyId: string): Promise<Budget | null> {
    return await prisma.budget.findFirst({
      where: {
        id: budgetId,
        familyId,
      },
    });
  }

  /**
   * Update budget (Father role only)
   */
  static async update(
    budgetId: string,
    familyId: string,
    data: UpdateBudgetData
  ): Promise<Budget> {
    // Check if budget exists
    const existingBudget = await this.findById(budgetId, familyId);
    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    // Validate update data
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.period !== undefined) updateData.period = data.period;

    return await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    });
  }

  /**
   * Delete budget (Father role only)
   */
  static async delete(budgetId: string, familyId: string): Promise<void> {
    // Check if budget exists
    const existingBudget = await this.findById(budgetId, familyId);
    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  /**
   * Get budget summary for family
   */
  static async getFamilyBudgetSummary(familyId: string, period?: BudgetPeriod): Promise<any> {
    const budgets = await this.findMany(familyId, period);
    
    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    const categoriesOnTrack = budgets.filter(budget => budget.status === 'ON_TRACK').length;
    const categoriesExceeded = budgets.filter(budget => budget.status === 'EXCEEDED').length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUtilization,
      categoriesOnTrack,
      categoriesExceeded,
    };
  }

  /**
   * Calculate spending for a category in a period
   */
  private static async calculateSpending(
    familyId: string,
    category: ExpenseCategory,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: {
        user: {
          familyId,
        },
        category,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get budget period dates
   */
  private static getBudgetPeriodDates(period: BudgetPeriod, year: number): { startDate: Date; endDate: Date } {
    const currentDate = new Date();
    
    if (period === 'MONTHLY') {
      const startDate = new Date(year, currentDate.getMonth(), 1);
      const endDate = new Date(year, currentDate.getMonth() + 1, 0);
      return { startDate, endDate };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      return { startDate, endDate };
    }
  }

  /**
   * Get budget categories
   */
  static getBudgetCategories(): Array<{ value: string; label: string; description: string }> {
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

  /**
   * Get budget periods
   */
  static getBudgetPeriods(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'MONTHLY',
        label: 'Monthly',
        description: 'Monthly budget allocation',
      },
      {
        value: 'YEARLY',
        label: 'Yearly',
        description: 'Yearly budget allocation',
      },
    ];
  }
}
