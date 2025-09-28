# Family Finance Expense Tracker - Data Model

## Overview

This document defines the complete data model for the Family Finance Expense Tracker, ensuring constitutional compliance with Security-First Design, Role-Based Access Control, and Comprehensive Data Management principles.

## Entity Relationship Diagram

```
Family (1) -----> (N) User
  |                    |
  |                    |
  v                    v
Budget (N) <------- Expense (N)
```

## Core Entities

### User Entity

**Purpose:** Store user information with role-based access control
**Constitutional Alignment:** Role-Based Access Control, Security-First Design

```typescript
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      UserRole
  familyId  String
  googleId  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  family   Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  expenses Expense[]

  @@map("users")
}

enum UserRole {
  FATHER
  MOTHER
  CHILD
}
```

**Business Rules:**
- Each user must belong to exactly one family
- Email must be unique across the system
- Google ID must be unique for OAuth2 integration
- Role determines access permissions

### Family Entity

**Purpose:** Group users into families for multi-tenant data isolation
**Constitutional Alignment:** Role-Based Access Control, Comprehensive Data Management

```typescript
model Family {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  users   User[]
  budgets Budget[]

  @@map("families")
}
```

**Business Rules:**
- Each family must have at least one user
- Family name is required for identification
- Family serves as data isolation boundary

### Expense Entity

**Purpose:** Store individual expense transactions with categorization
**Constitutional Alignment:** Comprehensive Data Management, Role-Based Access Control

```typescript
model Expense {
  id          String       @id @default(uuid())
  userId      String
  amount      Decimal      @db.Decimal(10, 2)
  category    ExpenseCategory
  description String
  date        DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relationships
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("expenses")
}

enum ExpenseCategory {
  FOOD
  TRANSPORT
  BILLS
  EDUCATION
  ENTERTAINMENT
  HEALTHCARE
  SAVINGS
  OTHER
}
```

**Business Rules:**
- Amount must be positive decimal value
- Category must be from predefined enumeration
- Date must be valid timestamp
- User must exist and be active
- Expenses are soft-deleted for audit purposes

### Budget Entity

**Purpose:** Define spending limits for expense categories (Father role only)
**Constitutional Alignment:** Role-Based Access Control, Comprehensive Data Management

```typescript
model Budget {
  id        String      @id @default(uuid())
  familyId  String
  category  ExpenseCategory
  amount    Decimal     @db.Decimal(10, 2)
  period    BudgetPeriod
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  // Relationships
  family Family @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([familyId, category, period])
  @@map("budgets")
}

enum BudgetPeriod {
  MONTHLY
  YEARLY
}
```

**Business Rules:**
- Only Father role can create/modify budgets
- One budget per category per period per family
- Amount must be positive decimal value
- Budget periods must be valid enumeration values

## Database Indexes

### Performance Indexes

```sql
-- User indexes
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Expense indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);

-- Budget indexes
CREATE INDEX idx_budgets_family_id ON budgets(family_id);
CREATE INDEX idx_budgets_category ON budgets(category);
CREATE INDEX idx_budgets_period ON budgets(period);
```

### Security Indexes

```sql
-- Audit trail indexes
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_budgets_created_at ON budgets(created_at);
CREATE INDEX idx_users_created_at ON users(created_at);
```

## Data Validation Rules

### User Validation

- **Email Format:** Valid email address pattern
- **Name Length:** 2-100 characters
- **Role Enumeration:** Must be FATHER, MOTHER, or CHILD
- **Google ID:** Non-empty string, unique constraint

### Expense Validation

- **Amount:** Positive decimal, precision 2 decimal places
- **Category:** Must be valid ExpenseCategory enumeration
- **Description:** 1-500 characters, required
- **Date:** Valid timestamp, not future date
- **User ID:** Must reference existing active user

### Budget Validation

- **Amount:** Positive decimal, precision 2 decimal places
- **Category:** Must be valid ExpenseCategory enumeration
- **Period:** Must be MONTHLY or YEARLY
- **Family ID:** Must reference existing family
- **Uniqueness:** One budget per category per period per family

## Data Access Patterns

### Role-Based Access Control

**Father Role:**
- Full access to all family data
- Can create/modify/delete budgets
- Can view all family member expenses
- Can manage family members

**Mother Role:**
- Full access to all family data
- Can view all family member expenses
- Cannot modify budgets
- Can manage child expenses

**Child Role:**
- Access only to own expenses
- Cannot view parent or sibling expenses
- Cannot access budget information
- Cannot manage family members

### Query Patterns

**Common Queries:**
```sql
-- Get user expenses for dashboard
SELECT * FROM expenses 
WHERE user_id = ? AND date >= ? AND date <= ?
ORDER BY date DESC;

-- Get family expenses (Father/Mother only)
SELECT e.*, u.name as user_name 
FROM expenses e
JOIN users u ON e.user_id = u.id
WHERE u.family_id = ? AND e.date >= ? AND e.date <= ?
ORDER BY e.date DESC;

-- Get budget vs actual spending
SELECT b.category, b.amount as budget_amount,
       COALESCE(SUM(e.amount), 0) as actual_amount
FROM budgets b
LEFT JOIN expenses e ON e.category = b.category 
    AND e.user_id IN (SELECT id FROM users WHERE family_id = b.family_id)
    AND e.date >= ? AND e.date <= ?
WHERE b.family_id = ? AND b.period = 'MONTHLY'
GROUP BY b.category, b.amount;
```

## Data Migration Strategy

### Initial Migration

```sql
-- Create tables in dependency order
1. families
2. users (references families)
3. budgets (references families)
4. expenses (references users)

-- Create indexes after table creation
-- Populate with seed data
```

### Schema Evolution

- **Backward Compatible Changes:** Add optional fields, new indexes
- **Breaking Changes:** Require data migration scripts
- **Version Control:** Prisma migrations with rollback capability

## Security Considerations

### Data Encryption

- **At Rest:** Database-level encryption for sensitive fields
- **In Transit:** HTTPS for all API communications
- **Application Level:** JWT token encryption, password hashing

### Access Control

- **Database Level:** Row-level security policies
- **Application Level:** Role-based middleware
- **API Level:** Endpoint protection based on user role

### Audit Trail

- **Created/Updated Timestamps:** All entities track modification times
- **Soft Deletes:** Preserve data for audit purposes
- **Change Logging:** Track sensitive data modifications

## Performance Optimization

### Query Optimization

- **Indexing Strategy:** Cover all common query patterns
- **Connection Pooling:** Efficient database connections
- **Query Caching:** Cache frequently accessed data
- **Pagination:** Limit result sets for large queries

### Data Archiving

- **Expense Archiving:** Archive old expenses after 2 years
- **Budget History:** Maintain historical budget data
- **User Activity:** Track user login and activity patterns

## Compliance Requirements

### Data Privacy

- **GDPR Compliance:** User data export and deletion
- **Data Retention:** Automatic cleanup of old data
- **Consent Management:** Track user consent for data processing

### Financial Regulations

- **Audit Trail:** Complete transaction history
- **Data Integrity:** Prevent data tampering
- **Backup Strategy:** Regular automated backups
- **Disaster Recovery:** Data recovery procedures

## Testing Strategy

### Data Model Testing

- **Unit Tests:** Entity validation and business rules
- **Integration Tests:** Database operations and relationships
- **Performance Tests:** Query performance under load
- **Security Tests:** Access control and data isolation

### Test Data

- **Seed Data:** Representative test data for all entities
- **Edge Cases:** Boundary conditions and error scenarios
- **Performance Data:** Large datasets for performance testing
- **Security Data:** Test cases for access control validation
