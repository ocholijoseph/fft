import { Router, Request, Response } from 'express';
import { ExpenseModel, CreateExpenseData, UpdateExpenseData, ExpenseFilters } from '../models/expense';
import { verifyToken } from '../services/auth';
import { authorizeRoles } from '../middleware/roles';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * GET /api/expenses
 * Get expenses with role-based filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      page = '1',
      limit = '20',
      category,
      startDate,
      endDate,
      search,
    } = req.query;

    const filters: ExpenseFilters = {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100), // Max 100 items per page
      category: category as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    };

    const { expenses, total } = await ExpenseModel.findMany(
      user.id,
      user.role,
      user.familyId,
      filters
    );

    // Calculate summary
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        expenses: expenses.map(expense => ({
          id: expense.id,
          amount: Number(expense.amount),
          category: expense.category,
          description: expense.description,
          date: expense.date.toISOString(),
          userId: expense.userId,
          userName: expense.user.name,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        })),
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total,
          totalPages: Math.ceil(total / filters.limit!),
        },
        summary: {
          totalAmount,
          categoryBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_EXPENSES_ERROR',
        message: 'Failed to fetch expenses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/expenses
 * Create new expense
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { amount, category, description, date } = req.body;

    // Validate required fields
    if (!amount || !category || !description || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            amount: !amount ? 'Amount is required' : undefined,
            category: !category ? 'Category is required' : undefined,
            description: !description ? 'Description is required' : undefined,
            date: !date ? 'Date is required' : undefined,
          },
        },
      });
    }

    const expenseData: CreateExpenseData = {
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
    };

    const expense = await ExpenseModel.create(user.id, expenseData);

    res.status(201).json({
      success: true,
      data: {
        expense: {
          id: expense.id,
          amount: Number(expense.amount),
          category: expense.category,
          description: expense.description,
          date: expense.date.toISOString(),
          userId: expense.userId,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_EXPENSE_ERROR',
        message: 'Failed to create expense',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/expenses/:id
 * Get expense by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id, user.id, user.role, user.familyId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: 'Expense not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        expense: {
          id: expense.id,
          amount: Number(expense.amount),
          category: expense.category,
          description: expense.description,
          date: expense.date.toISOString(),
          userId: expense.userId,
          userName: expense.user.name,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_EXPENSE_ERROR',
        message: 'Failed to fetch expense',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const updateData: UpdateExpenseData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);

    const expense = await ExpenseModel.update(id, user.id, user.role, user.familyId, updateData);

    res.json({
      success: true,
      data: {
        expense: {
          id: expense.id,
          amount: Number(expense.amount),
          category: expense.category,
          description: expense.description,
          date: expense.date.toISOString(),
          userId: expense.userId,
          createdAt: expense.createdAt.toISOString(),
          updatedAt: expense.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: error.message,
        },
      });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_EXPENSE_ERROR',
        message: 'Failed to update expense',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    await ExpenseModel.delete(id, user.id, user.role, user.familyId);

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: error.message,
        },
      });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPENSE_NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_EXPENSE_ERROR',
        message: 'Failed to delete expense',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/expenses/categories
 * Get available expense categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = ExpenseModel.getCategories();

    res.json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORIES_ERROR',
        message: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/expenses/analytics
 * Get expense analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { period = 'month', year, month, week } = req.query;

    let startDate: Date;
    let endDate: Date;

    const currentDate = new Date();
    const currentYear = year ? parseInt(year as string) : currentDate.getFullYear();
    const currentMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;

    switch (period) {
      case 'week':
        const weekNum = week ? parseInt(week as string) : Math.ceil(currentDate.getDate() / 7);
        startDate = new Date(currentYear, 0, (weekNum - 1) * 7 + 1);
        endDate = new Date(currentYear, 0, weekNum * 7);
        break;
      case 'month':
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 0);
        break;
      case 'year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        break;
      default:
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 0);
    }

    const analytics = await ExpenseModel.getAnalytics(
      user.id,
      user.role,
      user.familyId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          totalAmount: analytics.totalAmount,
          expenseCount: analytics.expenseCount,
          averageAmount: analytics.averageAmount,
        },
        categoryBreakdown: analytics.categoryBreakdown,
        trends: {
          // TODO: Implement trend analysis
          previousPeriodComparison: {
            totalAmount: 0,
            percentageChange: 0,
          },
          categoryTrends: [],
        },
        insights: [
          // TODO: Implement AI insights
          {
            type: 'SPENDING_INCREASE',
            message: 'Your spending has increased this period',
            severity: 'LOW',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
