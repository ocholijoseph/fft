# Dashboard API Contracts

## Overview

Dashboard API endpoints for analytics, insights, and chart data, ensuring constitutional compliance with Modern User Experience and AI-Powered Financial Insights principles.

## Dashboard Endpoints

### GET /api/dashboard/summary

**Purpose:** Get monthly expense summary for dashboard
**Constitutional Alignment:** Modern User Experience, Comprehensive Data Management

**Request:**
```typescript
GET /api/dashboard/summary?month=1&year=2025
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `month`: number (1-12, optional, default: current month)
- `year`: number (optional, default: current year)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "period": {
      "month": number,
      "year": number,
      "startDate": string,
      "endDate": string
    },
    "summary": {
      "totalExpenses": number,
      "totalBudget": number,
      "budgetUtilization": number,
      "expenseCount": number,
      "averageExpense": number
    },
    "comparison": {
      "previousMonth": {
        "totalExpenses": number,
        "percentageChange": number
      },
      "previousYear": {
        "totalExpenses": number,
        "percentageChange": number
      }
    },
    "topCategories": [
      {
        "category": string,
        "amount": number,
        "percentage": number,
        "budgetAmount": number,
        "budgetUtilization": number
      }
    ]
  }
}
```

**Business Rules:**
- **Role-Based Data:** Father/Mother see family data, Child sees own data
- **Budget Integration:** Include budget information when available
- **Comparison Data:** Previous period comparisons
- **Category Ranking:** Top spending categories

### GET /api/dashboard/trends

**Purpose:** Get spending trends over time for charts
**Constitutional Alignment:** Modern User Experience, AI-Powered Financial Insights

**Request:**
```typescript
GET /api/dashboard/trends?period=6months&granularity=month
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period`: "3months" | "6months" | "1year" | "2years"
- `granularity`: "week" | "month" | "quarter"
- `category`: ExpenseCategory (optional, for category-specific trends)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "period": {
      "type": string,
      "granularity": string,
      "startDate": string,
      "endDate": string
    },
    "trends": [
      {
        "period": string,
        "totalAmount": number,
        "categoryBreakdown": {
          "FOOD": number,
          "TRANSPORT": number,
          // ... other categories
        },
        "expenseCount": number
      }
    ],
    "insights": {
      "trendDirection": "INCREASING" | "DECREASING" | "STABLE",
      "growthRate": number,
      "volatility": "LOW" | "MEDIUM" | "HIGH",
      "seasonality": boolean,
      "peakPeriods": string[]
    }
  }
}
```

**Business Rules:**
- **Time Series Data:** Consistent granularity across periods
- **Category Breakdown:** Detailed category analysis
- **Trend Analysis:** Statistical trend calculations
- **Performance Optimization:** Cached results for common queries

### GET /api/dashboard/insights

**Purpose:** Get AI-generated financial insights and recommendations
**Constitutional Alignment:** AI-Powered Financial Insights

**Request:**
```typescript
GET /api/dashboard/insights?type=all&priority=high
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type`: "all" | "spending" | "budget" | "savings" | "trends"
- `priority`: "all" | "high" | "medium" | "low"
- `limit`: number (optional, default: 10, max: 20)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "insights": [
      {
        "id": string,
        "type": "SPENDING_ALERT" | "BUDGET_WARNING" | "SAVINGS_OPPORTUNITY" | "TREND_ANALYSIS" | "CATEGORY_INSIGHT",
        "title": string,
        "message": string,
        "priority": "HIGH" | "MEDIUM" | "LOW",
        "category": string,
        "impact": {
          "amount": number,
          "percentage": number
        },
        "recommendations": [
          {
            "action": string,
            "description": string,
            "potentialSavings": number
          }
        ],
        "generatedAt": string,
        "expiresAt": string
      }
    ],
    "summary": {
      "totalInsights": number,
      "highPriorityCount": number,
      "potentialSavings": number,
      "lastGenerated": string
    }
  }
}
```

**Business Rules:**
- **AI Generation:** OpenAI API integration for insights
- **Caching:** Cache insights for 24 hours
- **Personalization:** User-specific recommendations
- **Priority Filtering:** High-priority insights first

### GET /api/dashboard/charts

**Purpose:** Get chart data for dashboard visualizations
**Constitutional Alignment:** Modern User Experience

**Request:**
```typescript
GET /api/dashboard/charts?chart=categoryBreakdown&period=month
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `chart`: "categoryBreakdown" | "spendingTrend" | "budgetVsActual" | "monthlyComparison"
- `period`: "week" | "month" | "quarter" | "year"
- `startDate`: string (ISO date, optional)
- `endDate`: string (ISO date, optional)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "chartType": string,
    "period": {
      "startDate": string,
      "endDate": string
    },
    "data": {
      "labels": string[],
      "datasets": [
        {
          "label": string,
          "data": number[],
          "backgroundColor": string[],
          "borderColor": string[],
          "borderWidth": number
        }
      ]
    },
    "options": {
      "responsive": boolean,
      "maintainAspectRatio": boolean,
      "plugins": {
        "legend": {
          "position": string
        },
        "tooltip": {
          "enabled": boolean
        }
      }
    }
  }
}
```

**Business Rules:**
- **Chart Types:** Support for multiple chart types
- **Data Format:** Chart.js compatible data format
- **Responsive Design:** Mobile-friendly chart configurations
- **Performance:** Optimized data queries

## AI Insights Types

### Spending Alert
- **Trigger:** Unusual spending patterns
- **Purpose:** Alert users to unexpected expenses
- **Priority:** HIGH for significant deviations

### Budget Warning
- **Trigger:** Approaching or exceeding budget limits
- **Purpose:** Prevent budget overruns
- **Priority:** HIGH for critical categories

### Savings Opportunity
- **Trigger:** Identified cost-saving potential
- **Purpose:** Suggest money-saving strategies
- **Priority:** MEDIUM for actionable recommendations

### Trend Analysis
- **Trigger:** Significant spending trends
- **Purpose:** Provide spending pattern insights
- **Priority:** MEDIUM for awareness

### Category Insight
- **Trigger:** Category-specific spending patterns
- **Purpose:** Category-specific recommendations
- **Priority:** LOW for optimization

## Error Codes

### Dashboard Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_PERIOD | 400 | Invalid time period specified |
| INSUFFICIENT_DATA | 400 | Not enough data for analysis |
| AI_SERVICE_ERROR | 500 | AI insights service unavailable |
| CHART_GENERATION_ERROR | 500 | Failed to generate chart data |
| CACHE_ERROR | 500 | Failed to retrieve cached data |
| ANALYTICS_ERROR | 500 | Failed to generate analytics |

## Performance Requirements

### Response Times

- **Dashboard Summary:** < 500ms
- **Trends Data:** < 1 second
- **AI Insights:** < 2 seconds (with caching)
- **Chart Data:** < 300ms

### Caching Strategy

- **Summary Data:** 5 minutes cache
- **Trends Data:** 15 minutes cache
- **AI Insights:** 24 hours cache
- **Chart Data:** 10 minutes cache

## Security Considerations

### Data Access

- **Role-Based Filtering:** Automatic data filtering
- **Family Isolation:** Family-level data separation
- **Child Protection:** Limited child data access
- **Audit Logging:** Dashboard access tracking

### AI Data Privacy

- **Data Anonymization:** Remove personal identifiers
- **API Security:** Secure OpenAI API communication
- **Data Retention:** Limited insight data retention
- **User Consent:** AI processing consent tracking

## Testing Requirements

### Unit Tests

- **Analytics Calculations:** Mathematical accuracy
- **Data Aggregation:** Correct data grouping
- **Chart Data Generation:** Valid chart formats
- **AI Integration:** Mock AI responses

### Integration Tests

- **Database Queries:** Efficient data retrieval
- **AI Service:** Real AI API integration
- **Caching Layer:** Cache hit/miss scenarios
- **Performance:** Response time validation

### End-to-End Tests

- **Dashboard Loading:** Complete dashboard workflow
- **Chart Interactions:** Interactive chart functionality
- **Insight Generation:** AI insight display
- **Role-Based Access:** Different user experiences
