import { Router, Request, Response } from 'express';
import { FamilyModel } from '../models/family';
import { verifyToken } from '../services/auth';
import { authorizeRoles } from '../middleware/roles';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * GET /api/family/members
 * Get family members list (Father/Mother only)
 */
router.get('/members', authorizeRoles([UserRole.FATHER, UserRole.MOTHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const { family, members, summary } = await FamilyModel.getFamilyMembers(user.familyId);

    res.json({
      success: true,
      data: {
        family: {
          id: family.id,
          name: family.name,
          createdAt: family.createdAt.toISOString(),
        },
        members,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAMILY_MEMBERS_ERROR',
        message: 'Failed to fetch family members',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/family/invite
 * Invite new family member (Father/Mother only)
 */
router.post('/invite', authorizeRoles([UserRole.FATHER, UserRole.MOTHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { email, role, message } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            email: !email ? 'Email is required' : undefined,
            role: !role ? 'Role is required' : undefined,
          },
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
        },
      });
    }

    // Only allow inviting CHILD role
    if (role !== 'CHILD') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Can only invite Child role',
        },
      });
    }

    // For now, we'll simulate an invitation
    // In a real implementation, you would send an email invitation
    const invitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      status: 'PENDING',
      invitedBy: user.id,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    res.status(201).json({
      success: true,
      data: {
        invitation,
      },
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INVITATION_ERROR',
        message: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/children-expenses
 * Get children's expenses for parental oversight (Father/Mother only)
 */
router.get('/children-expenses', authorizeRoles([UserRole.FATHER, UserRole.MOTHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { childId, month, year, category } = req.query;

    const data = await FamilyModel.getChildrenExpenses(
      user.familyId,
      childId as string,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      category as string
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching children expenses:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CHILDREN_EXPENSES_ERROR',
        message: 'Failed to fetch children expenses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/family/children-expenses/:childId/approve
 * Approve child expense (Father/Mother only)
 */
router.post('/children-expenses/:childId/approve', authorizeRoles([UserRole.FATHER, UserRole.MOTHER]), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { childId } = req.params;
    const { expenseId, approved, comment } = req.body;

    // Validate required fields
    if (!expenseId || approved === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            expenseId: !expenseId ? 'Expense ID is required' : undefined,
            approved: approved === undefined ? 'Approval status is required' : undefined,
          },
        },
      });
    }

    const result = await FamilyModel.approveChildExpense(
      childId,
      expenseId,
      approved,
      comment || '',
      user.id
    );

    res.json({
      success: true,
      data: {
        expense: result,
      },
      message: 'Expense approval updated',
    });
  } catch (error) {
    console.error('Error approving child expense:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHILD_EXPENSE_NOT_FOUND',
          message: error.message,
        },
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_EXPENSE_ERROR',
        message: 'Failed to approve expense',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/info
 * Get family information
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const family = await FamilyModel.getFamilyInfo(user.familyId);

    if (!family) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FAMILY_NOT_FOUND',
          message: 'Family not found',
        },
      });
    }

    res.json({
      success: true,
      data: {
        family: {
          id: family.id,
          name: family.name,
          createdAt: family.createdAt.toISOString(),
          updatedAt: family.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching family info:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAMILY_INFO_ERROR',
        message: 'Failed to fetch family information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/family/statistics
 * Get family statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const statistics = await FamilyModel.getFamilyStatistics(user.familyId);

    res.json({
      success: true,
      data: {
        statistics,
      },
    });
  } catch (error) {
    console.error('Error fetching family statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAMILY_STATISTICS_ERROR',
        message: 'Failed to fetch family statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
