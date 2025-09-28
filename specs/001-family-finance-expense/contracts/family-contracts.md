# Family Management API Contracts

## Overview

Family management API endpoints for family member management, budget control, and child expense oversight, ensuring constitutional compliance with Role-Based Access Control principles.

## Family Endpoints

### GET /api/family/members

**Purpose:** Get family members list (Father/Mother only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
GET /api/family/members
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "family": {
      "id": string,
      "name": string,
      "createdAt": string
    },
    "members": [
      {
        "id": string,
        "name": string,
        "email": string,
        "role": "FATHER" | "MOTHER" | "CHILD",
        "joinedAt": string,
        "lastActive": string,
        "expenseCount": number,
        "totalSpent": number
      }
    ],
    "summary": {
      "totalMembers": number,
      "childrenCount": number,
      "totalFamilyExpenses": number,
      "averageExpensePerMember": number
    }
  }
}
```

**Response (Error - 403):**
```typescript
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only Father and Mother can view family members"
  }
}
```

**Business Rules:**
- **Access Control:** Father and Mother roles only
- **Member Information:** Include expense statistics
- **Activity Tracking:** Last active timestamp
- **Family Summary:** Aggregate family statistics

### POST /api/family/invite

**Purpose:** Invite new family member (Father/Mother only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
POST /api/family/invite
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": string,
  "role": "CHILD",
  "message": string
}
```

**Response (Success - 201):**
```typescript
{
  "success": true,
  "data": {
    "invitation": {
      "id": string,
      "email": string,
      "role": string,
      "status": "PENDING",
      "invitedBy": string,
      "invitedAt": string,
      "expiresAt": string
    }
  },
  "message": "Invitation sent successfully"
}
```

**Response (Error - 400):**
```typescript
{
  "success": false,
  "error": {
    "code": "INVITATION_ERROR",
    "message": "Failed to send invitation",
    "details": {
      "email": "Invalid email format",
      "role": "Cannot invite Father or Mother role"
    }
  }
}
```

**Business Rules:**
- **Access Control:** Father and Mother can invite
- **Role Restrictions:** Can only invite Child role
- **Email Validation:** Valid email format required
- **Invitation Expiry:** 7-day expiration period

### GET /api/family/children-expenses

**Purpose:** Get children's expenses for parental oversight (Father/Mother only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
GET /api/family/children-expenses?childId=uuid&month=1&year=2025
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `childId`: string (UUID, optional, specific child)
- `month`: number (1-12, optional, default: current month)
- `year`: number (optional, default: current year)
- `category`: ExpenseCategory (optional, filter by category)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "period": {
      "month": number,
      "year": number
    },
    "children": [
      {
        "child": {
          "id": string,
          "name": string,
          "email": string
        },
        "expenses": [
          {
            "id": string,
            "amount": number,
            "category": string,
            "description": string,
            "date": string,
            "createdAt": string
          }
        ],
        "summary": {
          "totalAmount": number,
          "expenseCount": number,
          "categoryBreakdown": {
            "FOOD": number,
            "ENTERTAINMENT": number
            // ... other categories
          }
        }
      }
    ],
    "familySummary": {
      "totalChildrenExpenses": number,
      "averagePerChild": number,
      "totalExpenseCount": number
    }
  }
}
```

**Business Rules:**
- **Access Control:** Father and Mother only
- **Child Filtering:** Optional specific child filter
- **Period Filtering:** Month/year filtering
- **Summary Data:** Child and family-level summaries

### POST /api/family/children-expenses/:childId/approve

**Purpose:** Approve child expense (Father/Mother only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
POST /api/family/children-expenses/:childId/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "expenseId": string,
  "approved": boolean,
  "comment": string
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
      "status": "APPROVED" | "REJECTED",
      "approvedBy": string,
      "approvedAt": string,
      "comment": string
    }
  },
  "message": "Expense approval updated"
}
```

**Business Rules:**
- **Access Control:** Father and Mother only
- **Child Validation:** Must be child's expense
- **Status Update:** Update expense approval status
- **Audit Trail:** Track approval actions

## Budget Management Endpoints

### GET /api/family/budgets

**Purpose:** Get family budgets
**Constitutional Alignment:** Role-Based Access Control, Comprehensive Data Management

**Request:**
```typescript
GET /api/family/budgets?period=monthly&year=2025
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period`: "monthly" | "yearly" (optional, default: monthly)
- `year`: number (optional, default: current year)

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "budgets": [
      {
        "id": string,
        "category": string,
        "amount": number,
        "period": "MONTHLY" | "YEARLY",
        "spent": number,
        "remaining": number,
        "utilizationPercentage": number,
        "status": "ON_TRACK" | "WARNING" | "EXCEEDED",
        "createdAt": string,
        "updatedAt": string
      }
    ],
    "summary": {
      "totalBudget": number,
      "totalSpent": number,
      "totalRemaining": number,
      "overallUtilization": number,
      "categoriesOnTrack": number,
      "categoriesExceeded": number
    }
  }
}
```

**Business Rules:**
- **Family Access:** All family members can view budgets
- **Period Filtering:** Monthly or yearly budgets
- **Utilization Calculation:** Real-time spending vs budget
- **Status Indicators:** Visual budget health indicators

### POST /api/family/budgets

**Purpose:** Create family budget (Father only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
POST /api/family/budgets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category": "FOOD" | "TRANSPORT" | "BILLS" | "EDUCATION" | "ENTERTAINMENT" | "HEALTHCARE" | "SAVINGS" | "OTHER",
  "amount": number,
  "period": "MONTHLY" | "YEARLY"
}
```

**Response (Success - 201):**
```typescript
{
  "success": true,
  "data": {
    "budget": {
      "id": string,
      "category": string,
      "amount": number,
      "period": string,
      "createdAt": string,
      "updatedAt": string
    }
  },
  "message": "Budget created successfully"
}
```

**Response (Error - 403):**
```typescript
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only Father can create budgets"
  }
}
```

**Business Rules:**
- **Access Control:** Father role only
- **Uniqueness:** One budget per category per period
- **Validation:** Positive amount, valid category
- **Family Association:** Automatically associated with family

### PUT /api/family/budgets/:id

**Purpose:** Update family budget (Father only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
PUT /api/family/budgets/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": number,
  "period": "MONTHLY" | "YEARLY"
}
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "budget": {
      "id": string,
      "category": string,
      "amount": number,
      "period": string,
      "updatedAt": string
    }
  },
  "message": "Budget updated successfully"
}
```

**Business Rules:**
- **Access Control:** Father role only
- **Validation:** Positive amount, valid period
- **Update Tracking:** Timestamp update
- **Family Validation:** Must be family's budget

### DELETE /api/family/budgets/:id

**Purpose:** Delete family budget (Father only)
**Constitutional Alignment:** Role-Based Access Control

**Request:**
```typescript
DELETE /api/family/budgets/:id
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "message": "Budget deleted successfully"
}
```

**Business Rules:**
- **Access Control:** Father role only
- **Soft Delete:** Preserve for audit purposes
- **Family Validation:** Must be family's budget
- **Cascade Update:** Update related analytics

## Error Codes

### Family Management Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INSUFFICIENT_PERMISSIONS | 403 | Insufficient role permissions |
| FAMILY_NOT_FOUND | 404 | Family record not found |
| MEMBER_NOT_FOUND | 404 | Family member not found |
| INVITATION_ERROR | 400 | Failed to send invitation |
| INVALID_ROLE | 400 | Invalid role for operation |
| BUDGET_EXISTS | 409 | Budget already exists for category/period |
| BUDGET_NOT_FOUND | 404 | Budget record not found |
| CHILD_EXPENSE_NOT_FOUND | 404 | Child expense not found |

## Security Considerations

### Role-Based Access Control

- **Father Privileges:** Full family management access
- **Mother Privileges:** View access, child expense management
- **Child Restrictions:** No family management access
- **Permission Validation:** Server-side role checking

### Data Protection

- **Family Isolation:** Strict family data separation
- **Child Privacy:** Appropriate child data protection
- **Audit Logging:** Family management action tracking
- **Invitation Security:** Secure invitation process

## Performance Requirements

### Response Times

- **Family Members:** < 300ms
- **Children Expenses:** < 500ms
- **Budget Management:** < 400ms
- **Invitation Process:** < 1 second

### Scalability

- **Family Size:** Support up to 10 family members
- **Expense Volume:** Handle 1000+ child expenses per month
- **Budget Complexity:** Support 20+ budget categories
- **Concurrent Access:** Multiple family members simultaneously

## Testing Requirements

### Unit Tests

- **Role Validation:** Permission checking logic
- **Family Operations:** CRUD operations
- **Budget Calculations:** Utilization calculations
- **Invitation Process:** Email and validation logic

### Integration Tests

- **Database Operations:** Family and budget CRUD
- **Role-Based Access:** Permission enforcement
- **Child Expense Management:** Parent-child workflows
- **Budget Tracking:** Real-time budget updates

### End-to-End Tests

- **Family Management:** Complete family setup workflow
- **Parent-Child Interaction:** Expense approval process
- **Budget Management:** Budget creation and tracking
- **Role-Based Scenarios:** Different user role experiences
