import { Router, Request, Response } from 'express';
import { ExpenseModel } from '../models/expense';
import { BudgetModel } from '../models/budget';
import { verifyToken } from '../services/auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

/**
 * GET /api/dashboard/summary
 * Get monthly expense summary for dashboard
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get expense analytics
    const expenseAnalytics = await ExpenseModel.getAnalytics(
      user.id,
      user.role,
      user.familyId,
      startDate,
      endDate
    );

    // Get budget information
    const budgets = await BudgetModel.findMany(user.familyId, 'MONTHLY', targetYear);
    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const budgetUtilization = totalBudget > 0 ? (expenseAnalytics.totalAmount / totalBudget) * 100 : 0;

    // Get previous month comparison
    const prevMonthStart = new Date(targetYear, targetMonth - 2, 1);
    const prevMonthEnd = new Date(targetYear, targetMonth - 1, 0);
    const prevMonthAnalytics = await ExpenseModel.getAnalytics(
      user.id,
      user.role,
      user.familyId,
      prevMonthStart,
      prevMonthEnd
    );

    const percentageChange = prevMonthAnalytics.totalAmount > 0 
      ? ((expenseAnalytics.totalAmount - prevMonthAnalytics.totalAmount) / prevMonthAnalytics.totalAmount) * 100 
      : 0;

    // Get previous year comparison
    const prevYearStart = new Date(targetYear - 1, targetMonth - 1, 1);
    const prevYearEnd = new Date(targetYear - 1, targetMonth, 0);
    const prevYearAnalytics = await ExpenseModel.getAnalytics(
      user.id,
      user.role,
      user.familyId,
      prevYearStart,
      prevYearEnd
    );

    const yearPercentageChange = prevYearAnalytics.totalAmount > 0 
      ? ((expenseAnalytics.totalAmount - prevYearAnalytics.totalAmount) / prevYearAnalytics.totalAmount) * 100 
      : 0;

    // Get top categories
    const topCategories = expenseAnalytics.categoryBreakdown
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(category => {
        const budget = budgets.find(b => b.category === category.category);
        return {
          category: category.category,
          amount: category.amount,
          percentage: category.percentage,
          budgetAmount: budget ? Number(budget.amount) : 0,
          budgetUtilization: budget ? (category.amount / Number(budget.amount)) * 100 : 0,
        };
      });

    res.json({
      success: true,
      data: {
        period: {
          month: targetMonth,
          year: targetYear,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          totalExpenses: expenseAnalytics.totalAmount,
          totalBudget,
          budgetUtilization,
          expenseCount: expenseAnalytics.expenseCount,
          averageExpense: expenseAnalytics.averageAmount,
        },
        comparison: {
          previousMonth: {
            totalExpenses: prevMonthAnalytics.totalAmount,
            percentageChange,
          },
          previousYear: {
            totalExpenses: prevYearAnalytics.totalAmount,
            percentageChange: yearPercentageChange,
          },
        },
        topCategories,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_SUMMARY_ERROR',
        message: 'Failed to fetch dashboard summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get spending trends over time for charts
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { period = '6months', granularity = 'month', category } = req.query;

    const currentDate = new Date();
    let startDate: Date;
    let endDate: Date = currentDate;

    // Calculate period dates
    switch (period) {
      case '3months':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        break;
      case '1year':
        startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
        break;
      case '2years':
        startDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
    }

    // Generate trend data based on granularity
    const trends = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodStart: Date;
      let periodEnd: Date;

      switch (granularity) {
        case 'week':
          periodStart = new Date(current);
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 6);
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          const quarter = Math.floor(current.getMonth() / 3);
          periodStart = new Date(current.getFullYear(), quarter * 3, 1);
          periodEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);
          current.setMonth(current.getMonth() + 3);
          break;
        default:
          periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          current.setMonth(current.getMonth() + 1);
      }

      // Get analytics for this period
      const analytics = await ExpenseModel.getAnalytics(
        user.id,
        user.role,
        user.familyId,
        periodStart,
        periodEnd
      );

      // Filter by category if specified
      let categoryBreakdown = analytics.categoryBreakdown;
      if (category) {
        const filteredCategory = categoryBreakdown.find(c => c.category === category);
        categoryBreakdown = filteredCategory ? [filteredCategory] : [];
      }

      trends.push({
        period: periodStart.toISOString().split('T')[0],
        totalAmount: analytics.totalAmount,
        categoryBreakdown: categoryBreakdown.reduce((acc, cat) => {
          acc[cat.category] = cat.amount;
          return acc;
        }, {} as Record<string, number>),
        expenseCount: analytics.expenseCount,
      });
    }

    // Calculate trend insights
    const amounts = trends.map(t => t.totalAmount);
    const firstHalf = amounts.slice(0, Math.floor(amounts.length / 2));
    const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    const trendDirection = growthRate > 5 ? 'INCREASING' : growthRate < -5 ? 'DECREASING' : 'STABLE';
    
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - (amounts.reduce((a, b) => a + b, 0) / amounts.length), 2), 0) / amounts.length;
    const volatility = variance > 10000 ? 'HIGH' : variance > 1000 ? 'MEDIUM' : 'LOW';

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          granularity,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        trends,
        insights: {
          trendDirection,
          growthRate,
          volatility,
          seasonality: false, // TODO: Implement seasonality detection
          peakPeriods: [], // TODO: Implement peak period detection
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDS_ERROR',
        message: 'Failed to fetch trends',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/dashboard/insights
 * Get AI-generated financial insights and recommendations
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { type = 'all', priority = 'all', limit = '10' } = req.query;

    // For now, return mock insights
    // TODO: Implement real AI insights using OpenAI API
    const mockInsights = [
      {
        id: 'insight_1',
        type: 'SPENDING_ALERT',
        title: 'Unusual Spending Detected',
        message: 'Your entertainment spending has increased by 40% this month compared to last month.',
        priority: 'HIGH',
        category: 'ENTERTAINMENT',
        impact: {
          amount: 150.00,
          percentage: 40,
        },
        recommendations: [
          {
            action: 'Review Entertainment Budget',
            description: 'Consider setting a monthly entertainment budget limit',
            potentialSavings: 75.00,
          },
        ],
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
      {
        id: 'insight_2',
        type: 'BUDGET_WARNING',
        title: 'Budget Alert',
        message: 'You have spent 85% of your food budget for this month.',
        priority: 'MEDIUM',
        category: 'FOOD',
        impact: {
          amount: 425.00,
          percentage: 85,
        },
        recommendations: [
          {
            action: 'Monitor Food Spending',
            description: 'Track daily food expenses to stay within budget',
            potentialSavings: 50.00,
          },
        ],
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Filter insights based on query parameters
    let filteredInsights = mockInsights;

    if (type !== 'all') {
      filteredInsights = filteredInsights.filter(insight => insight.type === type);
    }

    if (priority !== 'all') {
      filteredInsights = filteredInsights.filter(insight => insight.priority === priority);
    }

    const limitNum = Math.min(parseInt(limit as string), 20);
    filteredInsights = filteredInsights.slice(0, limitNum);

    const totalInsights = filteredInsights.length;
    const highPriorityCount = filteredInsights.filter(i => i.priority === 'HIGH').length;
    const potentialSavings = filteredInsights.reduce((sum, insight) => 
      sum + insight.recommendations.reduce((recSum, rec) => recSum + rec.potentialSavings, 0), 0
    );

    res.json({
      success: true,
      data: {
        insights: filteredInsights,
        summary: {
          totalInsights,
          highPriorityCount,
          potentialSavings,
          lastGenerated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INSIGHTS_ERROR',
        message: 'Failed to fetch insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/dashboard/charts
 * Get chart data for dashboard visualizations
 */
router.get('/charts', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { chart, period = 'month', startDate, endDate } = req.query;

    const currentDate = new Date();
    let chartStartDate: Date;
    let chartEndDate: Date = currentDate;

    if (startDate && endDate) {
      chartStartDate = new Date(startDate as string);
      chartEndDate = new Date(endDate as string);
    } else {
      // Default to current month
      chartStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      chartEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    // Get analytics for the period
    const analytics = await ExpenseModel.getAnalytics(
      user.id,
      user.role,
      user.familyId,
      chartStartDate,
      chartEndDate
    );

    let chartData: any = {};

    switch (chart) {
      case 'categoryBreakdown':
        chartData = {
          chartType: 'categoryBreakdown',
          period: {
            startDate: chartStartDate.toISOString(),
            endDate: chartEndDate.toISOString(),
          },
          data: {
            labels: analytics.categoryBreakdown.map(cat => cat.category),
            datasets: [
              {
                label: 'Amount Spent',
                data: analytics.categoryBreakdown.map(cat => cat.amount),
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#FF6384',
                  '#C9CBCF',
                ],
                borderColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#FF6384',
                  '#C9CBCF',
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
              tooltip: {
                enabled: true,
              },
            },
          },
        };
        break;

      case 'spendingTrend':
        // TODO: Implement spending trend chart data
        chartData = {
          chartType: 'spendingTrend',
          period: {
            startDate: chartStartDate.toISOString(),
            endDate: chartEndDate.toISOString(),
          },
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
              {
                label: 'Weekly Spending',
                data: [100, 150, 200, 175],
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                enabled: true,
              },
            },
          },
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CHART_TYPE',
            message: 'Invalid chart type specified',
          },
        });
    }

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHART_ERROR',
        message: 'Failed to fetch chart data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
