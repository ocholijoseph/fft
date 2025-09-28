import { Router, Request, Response } from 'express';
import { BudgetModel, CreateBudgetData, UpdateBudgetData } from '../models/budget';
import { verifyToken } from '../services/auth';
import { authorizeRoles } from '../middleware/roles';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * GET /api/family/budgets
 * Get family budgets
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { period, year } = req.query;

    const budgets = await BudgetModel.findMany(
      user.familyId,
      period as any,
      year ? parseInt(year as string) : undefined
    );

    const summary = await BudgetModel.getFamilyBudgetSummary(
      user.familyId,
      period as any
    );

    res.json({
      success: true,
      data: {
        budgets: budgets.map(budget => ({
          id: budget.id,
          category: budget.category,
          amount: Number(budget.amount),
          period: budget.period,
          spent: budget.spent,
          remaining: budget.remaining,
          utilizationPercentage: budget.utilizationPercentage,
          status: budget.status,
          createdAt: budget.createdAt.toISOString(),
          updatedAt: budget.updatedAt.toISOString(),
        })),
        summary: {
          totalBudget: summary.totalBudget,
          totalSpent: summary.totalSpent,
          totalRemaining: summary.totalRemaining,
          overallUtilization: summary.overallUtilization,
          categoriesOnTrack: summary.categoriesOnTrack,
          categoriesExceeded: summary.categoriesExceeded,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGETS_ERROR',
        message: 'Failed to fetch budgets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/family/budgets
 * Create family budget (Father only)
 */
router.post('/', authorizeRoles([UserRole.FATHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { category, amount, period } = req.body;

    // Validate required fields
    if (!category || !amount || !period) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            category: !category ? 'Category is required' : undefined,
            amount: !amount ? 'Amount is required' : undefined,
            period: !period ? 'Period is required' : undefined,
          },
        },
      });
    }

    const budgetData: CreateBudgetData = {
      category,
      amount: parseFloat(amount),
      period,
    };

    const budget = await BudgetModel.create(user.familyId, budgetData);

    res.status(201).json({
      success: true,
      data: {
        budget: {
          id: budget.id,
          category: budget.category,
          amount: Number(budget.amount),
          period: budget.period,
          createdAt: budget.createdAt.toISOString(),
          updatedAt: budget.updatedAt.toISOString(),
        },
      },
      message: 'Budget created successfully',
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BUDGET_EXISTS',
          message: error.message,
        },
      });
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_BUDGET_ERROR',
        message: 'Failed to create budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/budgets/:id
 * Get budget by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const budget = await BudgetModel.findById(id, user.familyId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found',
        },
      });
    }

    // Get spending information for this budget
    const budgets = await BudgetModel.findMany(user.familyId);
    const budgetWithSpending = budgets.find(b => b.id === id);

    if (!budgetWithSpending) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        budget: {
          id: budgetWithSpending.id,
          category: budgetWithSpending.category,
          amount: Number(budgetWithSpending.amount),
          period: budgetWithSpending.period,
          spent: budgetWithSpending.spent,
          remaining: budgetWithSpending.remaining,
          utilizationPercentage: budgetWithSpending.utilizationPercentage,
          status: budgetWithSpending.status,
          createdAt: budgetWithSpending.createdAt.toISOString(),
          updatedAt: budgetWithSpending.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGET_ERROR',
        message: 'Failed to fetch budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * PUT /api/family/budgets/:id
 * Update family budget (Father only)
 */
router.put('/:id', authorizeRoles([UserRole.FATHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { amount, period } = req.body;

    const updateData: UpdateBudgetData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period !== undefined) updateData.period = period;

    const budget = await BudgetModel.update(id, user.familyId, updateData);

    res.json({
      success: true,
      data: {
        budget: {
          id: budget.id,
          category: budget.category,
          amount: Number(budget.amount),
          period: budget.period,
          updatedAt: budget.updatedAt.toISOString(),
        },
      },
      message: 'Budget updated successfully',
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_BUDGET_ERROR',
        message: 'Failed to update budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * DELETE /api/family/budgets/:id
 * Delete family budget (Father only)
 */
router.delete('/:id', authorizeRoles([UserRole.FATHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    await BudgetModel.delete(id, user.familyId);

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_BUDGET_ERROR',
        message: 'Failed to delete budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/budgets/categories
 * Get available budget categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = BudgetModel.getBudgetCategories();

    res.json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching budget categories:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORIES_ERROR',
        message: 'Failed to fetch budget categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/budgets/periods
 * Get available budget periods
 */
router.get('/periods', async (req: Request, res: Response) => {
  try {
    const periods = BudgetModel.getBudgetPeriods();

    res.json({
      success: true,
      data: {
        periods,
      },
    });
  } catch (error) {
    console.error('Error fetching budget periods:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PERIODS_ERROR',
        message: 'Failed to fetch budget periods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
