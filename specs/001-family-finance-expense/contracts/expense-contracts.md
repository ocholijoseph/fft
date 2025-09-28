# Expense Management API Contracts

## Overview

Expense management API endpoints for CRUD operations, analytics, and reporting, ensuring constitutional compliance with Comprehensive Data Management and Role-Based Access Control principles.

## Expense Endpoints

### GET /api/expenses

**Purpose:** Retrieve expenses with role-based filtering
**Constitutional Alignment:** Comprehensive Data Management, Role-Based Access Control

**Request:**
```typescript
GET /api/expenses?page=1&limit=20&category=FOOD&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20, max: 100)
- `category`: ExpenseCategory (optional)
- `startDate`: string (ISO date, optional)
- `endDate`: string (ISO date, optional)
- `search`: string (description search, optional)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": string,
        "amount": number,
        "category": "FOOD" | "TRANSPORT" | "BILLS" | "EDUCATION" | "ENTERTAINMENT" | "HEALTHCARE" | "SAVINGS" | "OTHER",
        "description": string,
        "date": string,
        "userId": string,
        "userName": string,
        "createdAt": string,
        "updatedAt": string
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    },
    "summary": {
      "totalAmount": number,
      "categoryBreakdown": {
        "FOOD": number,
        "TRANSPORT": number,
        // ... other categories
      }
    }
  }
}
```

**Business Rules:**
- **Father/Mother:** Can view all family expenses
- **Child:** Can only view own expenses
- **Filtering:** Category, date range, search functionality
- **Pagination:** Limit results for performance
- **Summary:** Total amounts and category breakdown

### POST /api/expenses

**Purpose:** Create new expense record
**Constitutional Alignment:** Comprehensive Data Management

**Request:**
```typescript
POST /api/expenses
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": number,
  "category": "FOOD" | "TRANSPORT" | "BILLS" | "EDUCATION" | "ENTERTAINMENT" | "HEALTHCARE" | "SAVINGS" | "OTHER",
  "description": string,
  "date": string
}
```

**Response (Success - 201):**
```typescript
{
  "success": true,
  "data": {
    "expense": {
      "id": string,
      "amount": number,
      "category": string,
      "description": string,
      "date": string,
      "userId": string,
      "createdAt": string,
      "updatedAt": string
    }
  }
}
```

**Response (Error - 400):**
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid expense data",
    "details": {
      "amount": "Amount must be positive",
      "category": "Invalid category"
    }
  }
}
```

**Business Rules:**
- **Amount:** Must be positive decimal value
- **Category:** Must be valid enumeration value
- **Description:** Required, 1-500 characters
- **Date:** Cannot be future date
- **User Association:** Automatically associated with authenticated user

### PUT /api/expenses/:id

**Purpose:** Update existing expense record
**Constitutional Alignment:** Comprehensive Data Management, Role-Based Access Control

**Request:**
```typescript
PUT /api/expenses/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": number,
  "category": string,
  "description": string,
  "date": string
}
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "expense": {
      "id": string,
      "amount": number,
      "category": string,
      "description": string,
      "date": string,
      "userId": string,
      "createdAt": string,
      "updatedAt": string
    }
  }
}
```

**Business Rules:**
- **Ownership:** User can only update own expenses
- **Parents:** Can update child expenses
- **Validation:** Same validation rules as creation
- **Audit Trail:** Tracks update timestamp

### DELETE /api/expenses/:id

**Purpose:** Delete expense record (soft delete)
**Constitutional Alignment:** Comprehensive Data Management, Role-Based Access Control

**Request:**
```typescript
DELETE /api/expenses/:id
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Business Rules:**
- **Ownership:** User can only delete own expenses
- **Parents:** Can delete child expenses
- **Soft Delete:** Preserves data for audit purposes
- **Cascade:** Updates related analytics

### GET /api/expenses/categories

**Purpose:** Get available expense categories
**Constitutional Alignment:** Comprehensive Data Management

**Request:**
```typescript
GET /api/expenses/categories
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "categories": [
      {
        "value": "FOOD",
        "label": "Food & Dining",
        "description": "Groceries, restaurants, food delivery"
      },
      {
        "value": "TRANSPORT",
        "label": "Transportation",
        "description": "Gas, public transit, car maintenance"
      },
      {
        "value": "BILLS",
        "label": "Bills & Utilities",
        "description": "Rent, electricity, water, internet"
      },
      {
        "value": "EDUCATION",
        "label": "Education",
        "description": "School fees, books, courses"
      },
      {
        "value": "ENTERTAINMENT",
        "label": "Entertainment",
        "description": "Movies, games, subscriptions"
      },
      {
        "value": "HEALTHCARE",
        "label": "Healthcare",
        "description": "Medical expenses, pharmacy"
      },
      {
        "value": "SAVINGS",
        "label": "Savings",
        "description": "Emergency fund, investments"
      },
      {
        "value": "OTHER",
        "label": "Other",
        "description": "Miscellaneous expenses"
      }
    ]
  }
}
```

### GET /api/expenses/analytics

**Purpose:** Get expense analytics and insights
**Constitutional Alignment:** Comprehensive Data Management, AI-Powered Financial Insights

**Request:**
```typescript
GET /api/expenses/analytics?period=month&year=2025&month=1
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period`: "week" | "month" | "year"
- `year`: number
- `month`: number (1-12, required for month period)
- `week`: number (1-52, required for week period)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "period": {
      "type": string,
      "startDate": string,
      "endDate": string
    },
    "summary": {
      "totalAmount": number,
      "expenseCount": number,
      "averageAmount": number
    },
    "categoryBreakdown": [
      {
        "category": string,
        "amount": number,
        "percentage": number,
        "count": number
      }
    ],
    "trends": {
      "previousPeriodComparison": {
        "totalAmount": number,
        "percentageChange": number
      },
      "categoryTrends": [
        {
          "category": string,
          "amount": number,
          "percentageChange": number
        }
      ]
    },
    "insights": [
      {
        "type": "SPENDING_INCREASE" | "SPENDING_DECREASE" | "CATEGORY_TREND" | "BUDGET_ALERT",
        "message": string,
        "severity": "LOW" | "MEDIUM" | "HIGH"
      }
    ]
  }
}
```

**Business Rules:**
- **Role-Based Data:** Father/Mother see family data, Child sees own data
- **Period Calculations:** Accurate date range calculations
- **Trend Analysis:** Comparison with previous period
- **AI Insights:** Generated insights based on spending patterns

## Error Codes

### Expense Management Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid expense data |
| EXPENSE_NOT_FOUND | 404 | Expense record not found |
| UNAUTHORIZED_ACCESS | 403 | Cannot access this expense |
| CATEGORY_NOT_FOUND | 400 | Invalid expense category |
| FUTURE_DATE_ERROR | 400 | Cannot create expense with future date |
| INSUFFICIENT_PERMISSIONS | 403 | Insufficient permissions for operation |
| ANALYTICS_ERROR | 500 | Failed to generate analytics |

## Security Considerations

### Access Control

- **Role-Based Filtering:** Automatic data filtering based on user role
- **Ownership Validation:** Users can only access own expenses
- **Parent Privileges:** Parents can access child expenses
- **Data Isolation:** Family-level data separation

### Input Validation

- **Amount Validation:** Positive decimal values only
- **Category Validation:** Enumeration validation
- **Date Validation:** Valid timestamp, no future dates
- **Description Validation:** Length and content validation

### Data Protection

- **Soft Deletes:** Preserve data for audit purposes
- **Audit Trail:** Track all modifications
- **Data Encryption:** Sensitive data encryption
- **Rate Limiting:** Prevent abuse

## Performance Requirements

### Response Times

- **List Expenses:** < 500ms for 100 records
- **Create Expense:** < 300ms
- **Update Expense:** < 300ms
- **Delete Expense:** < 200ms
- **Analytics:** < 1 second for month view

### Scalability

- **Pagination:** Efficient pagination for large datasets
- **Indexing:** Optimized database indexes
- **Caching:** Analytics result caching
- **Query Optimization:** Efficient database queries

## Testing Requirements

### Unit Tests

- **CRUD Operations:** All expense operations
- **Validation:** Input validation rules
- **Business Logic:** Role-based access control
- **Error Handling:** All error scenarios

### Integration Tests

- **Database Operations:** Expense CRUD with database
- **Role-Based Access:** Permission validation
- **Analytics Generation:** Analytics calculation
- **API Endpoints:** Complete endpoint testing

### End-to-End Tests

- **Expense Workflow:** Complete expense management flow
- **Role-Based Scenarios:** Different user role behaviors
- **Analytics Dashboard:** Analytics data display
- **Search and Filter:** Expense search functionality
