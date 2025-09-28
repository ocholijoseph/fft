# Family Finance Expense Tracker - Quick Start Guide

## Overview

This quick start guide provides step-by-step instructions for setting up and testing the Family Finance Expense Tracker application, ensuring constitutional compliance and proper functionality validation.

## Prerequisites

### System Requirements
- **Node.js:** 18.0+ 
- **PostgreSQL:** 14.0+
- **Docker:** 20.0+ (optional, for containerized setup)
- **Git:** 2.30+

### Development Tools
- **IDE:** VS Code with TypeScript support
- **Database Client:** pgAdmin or DBeaver
- **API Testing:** Postman or Insomnia
- **Browser:** Chrome/Firefox with developer tools

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd family-finance-tracker

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ../..
```

### 2. Environment Configuration

**Backend Environment (.env):**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/family_finance_tracker"
DATABASE_HOST="localhost"
DATABASE_PORT="5432"
DATABASE_NAME="family_finance_tracker"
DATABASE_USER="username"
DATABASE_PASSWORD="password"

# Google OAuth2
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Server
PORT="4000"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

**Frontend Environment (.env):**
```bash
VITE_API_BASE_URL="http://localhost:4000/api"
VITE_APP_NAME="Family Finance Tracker"
```

### 3. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker run --name postgres-db \
  -e POSTGRES_DB=family_finance_tracker \
  -e POSTGRES_USER=username \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14

# Run database migrations
cd apps/backend
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

## Development Workflow

### 1. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
# Server running on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
# Application running on http://localhost:5173
```

### 2. Verify Setup

**Health Check:**
```bash
curl http://localhost:4000/api/health
# Expected: {"status": "ok", "timestamp": "..."}
```

**Database Connection:**
```bash
cd apps/backend
npm run prisma:studio
# Database GUI on http://localhost:5555
```

## Testing Scenarios

### Scenario 1: User Authentication Flow

**Objective:** Test Google OAuth2 authentication and role assignment

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click "Sign in with Google"
3. Complete Google OAuth2 flow
4. Verify user creation in database
5. Check role assignment (default: CHILD)
6. Verify JWT token generation

**Expected Results:**
- User record created in database
- JWT tokens generated and stored
- Redirect to dashboard
- Role-based navigation displayed

**Constitutional Validation:**
- ✅ Security-First Design: Secure OAuth2 flow
- ✅ Role-Based Access Control: Proper role assignment

### Scenario 2: Role-Based Access Control

**Objective:** Test three-tier role system permissions

**Test Users (from seed data):**
- **Father:** father@family.com (FATHER role)
- **Mother:** mother@family.com (MOTHER role)  
- **Child:** child@family.com (CHILD role)

**Father Role Tests:**
1. Login as Father
2. Verify access to all family expenses
3. Create family budget
4. View family members
5. Manage child expenses

**Mother Role Tests:**
1. Login as Mother
2. Verify access to all family expenses
3. Cannot create budgets
4. Can manage child expenses
5. View family members

**Child Role Tests:**
1. Login as Child
2. Verify access only to own expenses
3. Cannot view family budgets
4. Cannot access family management
5. Can create own expenses

**Expected Results:**
- Role-based data filtering working
- Permission restrictions enforced
- UI elements shown/hidden based on role

**Constitutional Validation:**
- ✅ Role-Based Access Control: Proper permission enforcement

### Scenario 3: Expense Management

**Objective:** Test expense CRUD operations and categorization

**Create Expense:**
```bash
curl -X POST http://localhost:4000/api/expenses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50,
    "category": "FOOD",
    "description": "Grocery shopping",
    "date": "2025-01-27"
  }'
```

**List Expenses:**
```bash
curl -X GET http://localhost:4000/api/expenses \
  -H "Authorization: Bearer <token>"
```

**Update Expense:**
```bash
curl -X PUT http://localhost:4000/api/expenses/<expense-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 30.00,
    "category": "FOOD",
    "description": "Updated grocery shopping",
    "date": "2025-01-27"
  }'
```

**Expected Results:**
- Expense created with proper validation
- Role-based expense listing
- Successful updates and deletions
- Category enumeration working

**Constitutional Validation:**
- ✅ Comprehensive Data Management: Proper expense tracking

### Scenario 4: Dashboard Analytics

**Objective:** Test dashboard data and chart generation

**Dashboard Summary:**
```bash
curl -X GET http://localhost:4000/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

**Spending Trends:**
```bash
curl -X GET http://localhost:4000/api/dashboard/trends?period=6months \
  -H "Authorization: Bearer <token>"
```

**Chart Data:**
```bash
curl -X GET http://localhost:4000/api/dashboard/charts?chart=categoryBreakdown \
  -H "Authorization: Bearer <token>"
```

**Expected Results:**
- Accurate expense summaries
- Trend data generation
- Chart-compatible data format
- Role-based data filtering

**Constitutional Validation:**
- ✅ Modern User Experience: Responsive dashboard data

### Scenario 5: AI Insights Integration

**Objective:** Test AI-powered financial insights

**Generate Insights:**
```bash
curl -X GET http://localhost:4000/api/dashboard/insights \
  -H "Authorization: Bearer <token>"
```

**Expected Results:**
- AI insights generated (if OpenAI API configured)
- Personalized recommendations
- Spending pattern analysis
- Cached results for performance

**Constitutional Validation:**
- ✅ AI-Powered Financial Insights: Intelligent analysis working

### Scenario 6: Family Management

**Objective:** Test family member management and budget control

**List Family Members (Father/Mother only):**
```bash
curl -X GET http://localhost:4000/api/family/members \
  -H "Authorization: Bearer <token>"
```

**Create Budget (Father only):**
```bash
curl -X POST http://localhost:4000/api/family/budgets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "FOOD",
    "amount": 500.00,
    "period": "MONTHLY"
  }'
```

**View Child Expenses (Father/Mother):**
```bash
curl -X GET http://localhost:4000/api/family/children-expenses \
  -H "Authorization: Bearer <token>"
```

**Expected Results:**
- Family member listing (role-restricted)
- Budget creation (Father only)
- Child expense oversight (Parents only)
- Permission validation working

**Constitutional Validation:**
- ✅ Role-Based Access Control: Family management permissions

## Performance Testing

### Load Testing Scenarios

**Concurrent Users:**
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/expenses
```

**Response Time Validation:**
- Authentication: < 2 seconds
- Expense CRUD: < 500ms
- Dashboard data: < 1 second
- AI insights: < 2 seconds

### Database Performance

**Query Optimization:**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM expenses 
WHERE user_id = 'uuid' AND date >= '2025-01-01';

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('users', 'expenses', 'budgets');
```

## Security Testing

### Authentication Security

**Token Validation:**
```bash
# Test invalid token
curl -X GET http://localhost:4000/api/expenses \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized

# Test expired token
curl -X GET http://localhost:4000/api/expenses \
  -H "Authorization: Bearer expired-token"
# Expected: 401 Unauthorized
```

### Role-Based Security

**Permission Testing:**
```bash
# Child trying to access family members
curl -X GET http://localhost:4000/api/family/members \
  -H "Authorization: Bearer <child-token>"
# Expected: 403 Forbidden

# Mother trying to create budget
curl -X POST http://localhost:4000/api/family/budgets \
  -H "Authorization: Bearer <mother-token>" \
  -H "Content-Type: application/json" \
  -d '{"category": "FOOD", "amount": 500, "period": "MONTHLY"}'
# Expected: 403 Forbidden
```

### Input Validation

**Malicious Input Testing:**
```bash
# SQL injection attempt
curl -X POST http://localhost:4000/api/expenses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": "0; DROP TABLE expenses; --", "category": "FOOD"}'
# Expected: 400 Bad Request (validation error)
```

## Troubleshooting

### Common Issues

**Database Connection:**
```bash
# Check PostgreSQL status
docker ps | grep postgres
# Or
systemctl status postgresql

# Test connection
psql -h localhost -U username -d family_finance_tracker
```

**OAuth2 Configuration:**
- Verify Google OAuth2 credentials
- Check callback URL configuration
- Ensure redirect URIs match

**Environment Variables:**
```bash
# Verify environment loading
cd apps/backend
npm run env:check
```

**Port Conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :4000
netstat -tulpn | grep :5173
```

### Debug Mode

**Backend Debug:**
```bash
cd apps/backend
DEBUG=* npm run dev
```

**Frontend Debug:**
```bash
cd apps/frontend
npm run dev -- --debug
```

## Production Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Verify services
docker-compose ps
```

### Environment Configuration

**Production Environment:**
- Use environment-specific .env files
- Configure production database
- Set up SSL certificates
- Configure production OAuth2 credentials

### Monitoring

**Health Checks:**
```bash
curl https://your-domain.com/api/health
curl https://your-domain.com/api/status
```

**Performance Monitoring:**
- Set up application monitoring
- Configure error tracking
- Monitor database performance
- Track API response times

## Success Criteria Validation

### Constitutional Compliance Checklist

- ✅ **Security-First Design:** OAuth2 authentication, JWT tokens, input validation
- ✅ **Role-Based Access Control:** Three-tier permissions, family management
- ✅ **Modern User Experience:** Responsive design, intuitive interface
- ✅ **AI-Powered Financial Insights:** OpenAI integration, personalized recommendations
- ✅ **Comprehensive Data Management:** Structured database, expense tracking

### Feature Validation Checklist

- ✅ **Google OAuth2 Authentication:** Working login flow
- ✅ **Three-Tier User Roles:** Father/Mother/Child permissions
- ✅ **Expense Tracking:** CRUD operations, categorization
- ✅ **Dashboard Analytics:** Charts, summaries, trends
- ✅ **Family Management:** Member management, budget control
- ✅ **AI Insights:** Financial recommendations, spending analysis
- ✅ **Responsive Design:** Mobile, tablet, desktop compatibility

## Next Steps

1. **Code Review:** Review implementation against specifications
2. **Testing:** Complete comprehensive test suite
3. **Documentation:** Update user documentation
4. **Deployment:** Deploy to production environment
5. **Monitoring:** Set up production monitoring
6. **Maintenance:** Establish maintenance procedures

This quick start guide ensures proper setup and validation of all constitutional requirements and feature specifications.
