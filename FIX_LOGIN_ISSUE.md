# Fix for Login "Unauthorized" Issue

## The Problem
Your current users have `NULL` company_id but the login query requires a valid company with `c.is_deleted = 0`.

## Quick Fix Options

### Option 1: Update existing user's company_id (Fastest)
```sql
-- First, make sure a default company exists
INSERT INTO T_Companies (id, token, CompanyName, CompanyInfo, Industry, Email, is_deleted)
VALUES (2, 'comp_user_company_456', 'User Company', 'Default user company', 'General', 'admin@user.com', 0)
ON DUPLICATE KEY UPDATE is_deleted = 0;

-- Then update your user
UPDATE M_Users SET company_id = 1 WHERE email = 'aljon.montecalvo08@gmail.com';
-- OR if that email doesn't exist, update by id:
UPDATE M_Users SET company_id = 1 WHERE id = 2;
```

### Option 2: Create a new temporary login that handles NULL companies
Replace the login query temporarily to allow users without companies:

```typescript
const users = (await query(`
  SELECT u.id, u.token, u.first_name, u.last_name, u.email, u.password_hash, u.role_id,
         u.group_roles, u.is_active, u.company_id, r.role_name, r.permissions,
         COALESCE(c.is_deleted, 0) as company_is_deleted
  FROM M_Users u
  JOIN M_Roles r ON u.role_id = r.id
  LEFT JOIN T_Companies c ON u.company_id = c.id
  WHERE u.email = ? AND u.is_active = 1
  AND (u.company_id IS NULL OR c.is_deleted = 0)
`, [email])) as unknown as LoginUserRecord[];
```

### Option 3: Migrate all users to have a company
```sql
-- Create a default company if it doesn't exist
INSERT INTO T_Companies (id, token, CompanyName, CompanyInfo, Industry, Email)
VALUES (1, 'comp_default_company_123', 'Default Company', 'Default company for users without companies', 'General', 'admin@default.com');

-- Update all users with NULL company_id to use this company
UPDATE M_Users SET company_id = 1 WHERE company_id IS NULL;
```

## Testing the Fix
1. Apply one of the SQL fixes above to your database
2. Try logging in again
3. Check the browser console for error messages if it still fails

## Next Steps
Once you can login successfully, use the registration endpoint to create new users with proper companies:
- POST to `/api/auth/register` with proper company assignment
- Update the registration code to automatically assign a company to new users