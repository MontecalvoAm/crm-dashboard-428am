# CRM Multi-Tenancy Implementation

## Summary

The CRM system has been refactored to implement multi-tenant data isolation with the following features:

### 1. Database Schema Changes

#### Added T_Companies Table
```sql
CREATE TABLE T_Companies (
    id INT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    CompanyName VARCHAR(255) NOT NULL,
    CompanyInfo TEXT,
    CompanyProfile TEXT,
    Industry VARCHAR(100),
    Email VARCHAR(255),
    Phone VARCHAR(50),
    WebsiteURL VARCHAR(255),
    SocialURL VARCHAR(255),
    LogoURL VARCHAR(500),
    Address TEXT,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=INNODB;
```

#### Updated M_Users Table
- Added `company_id INT NOT NULL` field
- Added foreign key constraint: `FOREIGN KEY (company_id) REFERENCES T_Companies(id) ON DELETE CASCADE`

#### Updated T_Leads Table
- Added `company_id INT NOT NULL` field
- Added foreign key constraint: `FOREIGN KEY (company_id) REFERENCES T_Companies(id) ON DELETE CASCADE`
- Added `is_deleted TINYINT(1) DEFAULT 0` field

### 2. Authentication Updates

#### JWT Session (src/lib/auth/session.ts)
- Added `companyId: number` to JWTPayload interface
- Updated `createSession` to accept company ID
- Added `getCompanyContext` helper function

#### Login Route (src/app/api/auth/login/route.ts)
- Modified query to join with T_Companies table
- Added check for `company_is_deleted` status
- Returns error message: "The company has been deleted by admin. Please contact admin for more details."
- Creates JWT session with company_id included

### 3. Middleware Implementation

Created src/middleware.ts that:
- Validates JWT tokens on protected API routes
- Checks if company is deleted (is_deleted = 1)
- Blocks access with the exact error message: "The company has been deleted by admin. Please contact admin for more details."
- Adds company context to request headers (x-company-id, x-user-token, x-user-role-id)

### 4. API Routes Updated

#### Leads Route (src/app/api/leads/route.ts)
- **GET**: Filters leads by company_id
- **POST**: Creates new leads with company_id

#### Leads [id] Route (src/app/api/leads/[id]/route.ts)
- **GET**: Returns only leads belonging to the user's company
- **PATCH**: Updates leads only within the user's company
- **DELETE**: Soft deletes leads only within the user's company

#### Companies Route (src/app/api/companies/route.ts)
- **GET**: Returns only the current user's company details
- **POST**: Created for admin functionality (admin company creation)

### 5. Security Features

1. **Data Isolation**: All queries now filter by `company_id`
2. **Soft Deletion**: Companies can be soft deleted without losing data
3. **Cascade Deletes**: Deletes cascade from companies to users and leads
4. **Authentication Check**: Middleware validates JWT on every protected route
5. **Company Deletion Block**: Users cannot access if their company is deleted

### 6. Key Implementation Details

- JWT tokens include company context
- Every API request includes company context in headers
- Foreign key constraints ensure referential integrity
- All CRUD operations are scoped to the user's company
- Frontend receives company_id in login response for UI metadata

### 7. Testing Requirements

To test the implementation:

1. **Database Testing**: Execute the updated SQL schema
2. **Authentication Testing**:
   - Create a company and user
   - Test login with valid/invalid companies
   - Test company deletion blocking
3. **API Testing**:
   - Verify leads are filtered by company
   - Verify users only see their company's data
   - Verify CRUD operations respect company boundaries
4. **Security Testing**:
   - Attempt to access data from other companies
   - Test middleware blocks on deleted companies
   - Verify JWT token validation

### 8. Security Considerations

- All database queries must include `company_id` filter
- Middleware validates JWT tokens before every protected request
- Company deletion status is checked at login and on every request
- Foreign key constraints prevent orphaned records
- Soft deletion preserves data while blocking access

## Next Steps

1. Create a company management UI for super admins
2. Add company assignment during user registration
3. Implement company-specific configurations
4. Add multi-tenant dashboard analytics
5. Create backup/restore procedures per company