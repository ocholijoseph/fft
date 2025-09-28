# Authentication API Contracts

## Overview

Authentication API endpoints for Google OAuth2 integration and session management, ensuring constitutional compliance with Security-First Design and Role-Based Access Control principles.

## Authentication Endpoints

### POST /api/auth/google

**Purpose:** Initiate Google OAuth2 authentication flow
**Constitutional Alignment:** Security-First Design, Google OAuth2 Authentication

**Request:**
```typescript
POST /api/auth/google
Content-Type: application/json

{
  "code": string,           // Google OAuth2 authorization code
  "state": string           // CSRF protection state parameter
}
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": string,
      "email": string,
      "name": string,
      "role": "FATHER" | "MOTHER" | "CHILD",
      "familyId": string
    },
    "tokens": {
      "accessToken": string,
      "refreshToken": string,
      "expiresIn": number
    }
  }
}
```

**Response (Error - 400/401/500):**
```typescript
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details?: string
  }
}
```

**Business Rules:**
- Validates Google OAuth2 authorization code
- Creates or updates user record
- Assigns default role if new user
- Generates JWT access and refresh tokens
- Sets secure HTTP-only cookies

### POST /api/auth/refresh

**Purpose:** Refresh expired access token using refresh token
**Constitutional Alignment:** Security-First Design

**Request:**
```typescript
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": string
}
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "accessToken": string,
    "expiresIn": number
  }
}
```

**Response (Error - 401):**
```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

**Business Rules:**
- Validates refresh token
- Generates new access token
- Maintains user session
- Refreshes token expiration

### POST /api/auth/logout

**Purpose:** Invalidate user session and tokens
**Constitutional Alignment:** Security-First Design

**Request:**
```typescript
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": string
}
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Business Rules:**
- Invalidates access token
- Invalidates refresh token
- Clears session data
- Removes HTTP-only cookies

### GET /api/auth/profile

**Purpose:** Get current user profile information
**Constitutional Alignment:** Security-First Design, Role-Based Access Control

**Request:**
```typescript
GET /api/auth/profile
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": string,
      "email": string,
      "name": string,
      "role": "FATHER" | "MOTHER" | "CHILD",
      "familyId": string,
      "createdAt": string,
      "updatedAt": string
    },
    "family": {
      "id": string,
      "name": string
    }
  }
}
```

**Response (Error - 401):**
```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired access token"
  }
}
```

**Business Rules:**
- Requires valid access token
- Returns user profile and family information
- Role-based data filtering
- Real-time user status

## Error Codes

### Authentication Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_OAUTH_CODE | 400 | Google OAuth2 code is invalid |
| OAUTH_STATE_MISMATCH | 400 | CSRF state parameter mismatch |
| USER_CREATION_FAILED | 500 | Failed to create user record |
| TOKEN_GENERATION_FAILED | 500 | Failed to generate JWT tokens |
| INVALID_REFRESH_TOKEN | 401 | Refresh token is invalid or expired |
| TOKEN_REFRESH_FAILED | 500 | Failed to refresh access token |
| INVALID_ACCESS_TOKEN | 401 | Access token is invalid or expired |
| LOGOUT_FAILED | 500 | Failed to invalidate session |

## Security Considerations

### Token Security

- **JWT Tokens:** Signed with secure secret, short expiration
- **Refresh Tokens:** Long-lived, stored securely, single-use
- **HTTP-Only Cookies:** Prevent XSS attacks
- **CSRF Protection:** State parameter validation

### Input Validation

- **OAuth Code:** Valid Google OAuth2 authorization code format
- **State Parameter:** CSRF protection validation
- **Token Format:** JWT token structure validation
- **User Data:** Sanitization and validation

### Rate Limiting

- **Authentication Endpoints:** 5 requests per minute per IP
- **Token Refresh:** 10 requests per minute per user
- **Profile Access:** 100 requests per minute per user

## Testing Requirements

### Unit Tests

- **OAuth2 Flow:** Mock Google OAuth2 responses
- **Token Generation:** JWT token creation and validation
- **User Creation:** Database user record creation
- **Error Handling:** All error scenarios

### Integration Tests

- **Google OAuth2:** Real OAuth2 flow testing
- **Database Operations:** User CRUD operations
- **Session Management:** Token lifecycle testing
- **Security Middleware:** Authentication middleware

### End-to-End Tests

- **Login Flow:** Complete authentication workflow
- **Token Refresh:** Automatic token renewal
- **Logout Flow:** Session invalidation
- **Profile Access:** Authenticated profile retrieval

## Performance Requirements

### Response Times

- **OAuth Authentication:** < 2 seconds
- **Token Refresh:** < 500ms
- **Profile Access:** < 200ms
- **Logout:** < 300ms

### Scalability

- **Concurrent Users:** Support 1000+ simultaneous users
- **Token Storage:** Efficient token validation
- **Database Queries:** Optimized user lookups
- **Caching:** User session caching
