// Auth & User Management Type Definitions
// Matching backend DTOs from com.sih.module.auth.dto

export enum UserRole {
    BENEFICIARY = 'BENEFICIARY',
    OFFICER = 'OFFICER',
    ADMIN = 'ADMIN',
    PARTNER = 'PARTNER',
}

// ============= Auth Request/Response Types =============

export interface RegisterRequest {
    email: string;
    phoneNumber: string;
    password: string;
    preferredLanguage?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    userId: number;
    email: string;
    role: UserRole;
    preferredLanguage?: string;
    expiresIn: number;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface VerifyOtpRequest {
    phoneNumber?: string;
    email?: string;
    otp: string;
}

export interface ResendOtpRequest {
    phoneNumber: string;
}

// ============= User Management Types =============

export interface UserProfileResponse {
    userId: number;
    email: string;
    phoneNumber: string;
    role: UserRole;
    isActive: boolean;
    preferredLanguage?: string;
    createdAt: string;
}

export interface UpdateUserRequest {
    phoneNumber?: string;
    preferredLanguage?: string;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface UserListResponse {
    users: UserProfileResponse[];
    total: number;
}

export interface StatusUpdateRequest {
    isActive: boolean;
    reason?: string;
}

// ============= Feature Flag Types =============

export interface FeatureFlagResponse {
    flagName: string;
    flagValue: boolean;
    description?: string;
    lastChangedAt: string;
}

export interface FeatureFlagUpdateRequest {
    flagValue: boolean;
    description?: string;
}

// ============= Common Response Types =============

export interface StatusResponse {
    success: boolean;
    message: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}
