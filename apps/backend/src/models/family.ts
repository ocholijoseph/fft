import { PrismaClient, User, Family } from '@prisma/client';

const prisma = new PrismaClient();

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  expenseCount: number;
  totalSpent: number;
}

export interface FamilySummary {
  totalMembers: number;
  childrenCount: number;
  totalFamilyExpenses: number;
  averageExpensePerMember: number;
}

export interface ChildExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface ChildExpenseSummary {
  totalAmount: number;
  expenseCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface FamilyMemberWithExpenses {
  child: {
    id: string;
    name: string;
    email: string;
  };
  expenses: ChildExpense[];
  summary: ChildExpenseSummary;
}

export class FamilyModel {
  /**
   * Get family members (Father/Mother only)
   */
  static async getFamilyMembers(familyId: string): Promise<{
    family: Family;
    members: FamilyMember[];
    summary: FamilySummary;
  }> {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new Error('Family not found');
    }

    const users = await prisma.user.findMany({
      where: { familyId },
      include: {
        expenses: {
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const members: FamilyMember[] = users.map(user => {
      const totalSpent = user.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const expenseCount = user.expenses.length;
      const lastActive = user.expenses.length > 0 
        ? user.expenses[user.expenses.length - 1].createdAt.toISOString()
        : user.createdAt.toISOString();

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt.toISOString(),
        lastActive,
        expenseCount,
        totalSpent,
      };
    });

    const childrenCount = members.filter(member => member.role === 'CHILD').length;
    const totalFamilyExpenses = members.reduce((sum, member) => sum + member.totalSpent, 0);
    const averageExpensePerMember = members.length > 0 ? totalFamilyExpenses / members.length : 0;

    const summary: FamilySummary = {
      totalMembers: members.length,
      childrenCount,
      totalFamilyExpenses,
      averageExpensePerMember,
    };

    return {
      family,
      members,
      summary,
    };
  }

  /**
   * Get children's expenses for parental oversight (Father/Mother only)
   */
  static async getChildrenExpenses(
    familyId: string,
    childId?: string,
    month?: number,
    year?: number,
    category?: string
  ): Promise<{
    period: { month: number; year: number };
    children: FamilyMemberWithExpenses[];
    familySummary: {
      totalChildrenExpenses: number;
      averagePerChild: number;
      totalExpenseCount: number;
    };
  }> {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get children users
    let whereClause: any = {
      familyId,
      role: 'CHILD',
    };

    if (childId) {
      whereClause.id = childId;
    }

    const children = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const childrenWithExpenses: FamilyMemberWithExpenses[] = [];

    for (const child of children) {
      let expenseWhere: any = {
        userId: child.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (category) {
        expenseWhere.category = category;
      }

      const expenses = await prisma.expense.findMany({
        where: expenseWhere,
        orderBy: {
          date: 'desc',
        },
      });

      const expenseData: ChildExpense[] = expenses.map(expense => ({
        id: expense.id,
        amount: Number(expense.amount),
        category: expense.category,
        description: expense.description,
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString(),
      }));

      const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const expenseCount = expenses.length;
      const categoryBreakdown = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);

      childrenWithExpenses.push({
        child,
        expenses: expenseData,
        summary: {
          totalAmount,
          expenseCount,
          categoryBreakdown,
        },
      });
    }

    const totalChildrenExpenses = childrenWithExpenses.reduce(
      (sum, child) => sum + child.summary.totalAmount,
      0
    );
    const totalExpenseCount = childrenWithExpenses.reduce(
      (sum, child) => sum + child.summary.expenseCount,
      0
    );
    const averagePerChild = childrenWithExpenses.length > 0 
      ? totalChildrenExpenses / childrenWithExpenses.length 
      : 0;

    return {
      period: {
        month: targetMonth,
        year: targetYear,
      },
      children: childrenWithExpenses,
      familySummary: {
        totalChildrenExpenses,
        averagePerChild,
        totalExpenseCount,
      },
    };
  }

  /**
   * Approve child expense (Father/Mother only)
   */
  static async approveChildExpense(
    childId: string,
    expenseId: string,
    approved: boolean,
    comment: string,
    approverId: string
  ): Promise<any> {
    // Verify the expense belongs to the child
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        userId: childId,
      },
    });

    if (!expense) {
      throw new Error('Child expense not found');
    }

    // For now, we'll just return the expense with approval status
    // In a real implementation, you might want to add approval fields to the expense model
    return {
      id: expense.id,
      amount: Number(expense.amount),
      category: expense.category,
      description: expense.description,
      date: expense.date.toISOString(),
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
      comment,
    };
  }

  /**
   * Get family information
   */
  static async getFamilyInfo(familyId: string): Promise<Family | null> {
    return await prisma.family.findUnique({
      where: { id: familyId },
    });
  }

  /**
   * Check if user is part of family
   */
  static async isUserInFamily(userId: string, familyId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        familyId,
      },
    });

    return !!user;
  }

  /**
   * Get family statistics
   */
  static async getFamilyStatistics(familyId: string): Promise<any> {
    const [totalExpenses, totalBudget, memberCount] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          user: {
            familyId,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.budget.aggregate({
        where: {
          familyId,
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.user.count({
        where: {
          familyId,
        },
      }),
    ]);

    return {
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      expenseCount: totalExpenses._count.id,
      totalBudget: Number(totalBudget._sum.amount || 0),
      memberCount,
      averageExpensePerMember: memberCount > 0 ? Number(totalExpenses._sum.amount || 0) / memberCount : 0,
    };
  }
}
