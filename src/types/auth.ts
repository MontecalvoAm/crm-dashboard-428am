// Authentication and JWT types

export interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  groupRoles: number[];
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  groupRoles: number[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: number;
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  success: boolean;
  user: UserData;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  message?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: string[];
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId?: number;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Role management types
export interface RolePermission {
  action: string;
  resources: string[];
  conditions?: string[];
}

export interface UserRoleWithPermissions {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

// API error types for authentication
export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'INVALID_TOKEN' | 'RATE_LIMITED' | 'VALIDATION_ERROR';
  message: string;
  details?: Record<string, any>;
}