// Auth API Service Layer
// Centralized service for all authentication-related API calls

import { fetchFromApi } from '@/lib/api';
import type {
    RegisterRequest,
    AuthResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    LoginRequest,
    VerifyOtpRequest,
} from '@/types/auth-types';

export const authService = {
    /**
     * Register new user
     * POST /api/v1/auth/register
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        return await fetchFromApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Login with email/phone and password
     * POST /api/v1/auth/login
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        return await fetchFromApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Verify OTP after registration
     * POST /api/v1/auth/verify-otp
     */
    async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
        return await fetchFromApi('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Resend OTP to phone/email
     * POST /api/v1/auth/resend-otp
     */
    async resendOtp(identifier: string): Promise<void> {
        // Determine if identifier is email or phone
        const isEmail = identifier.includes('@');
        const body = isEmail
            ? { email: identifier }
            : { phoneNumber: identifier };

        await fetchFromApi('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh-token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        return await fetchFromApi('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    },

    /**
     * Logout user
     * POST /api/v1/auth/logout
     */
    async logout(): Promise<void> {
        const token = localStorage.getItem('credit-assist-token');
        if (token) {
            await fetchFromApi('/auth/logout', {
                method: 'POST',
            });
        }
    },

    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
        await fetchFromApi('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(data: ResetPasswordRequest): Promise<void> {
        await fetchFromApi('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get email configuration status
     * GET /api/v1/auth/email-config-status
     */
    async getEmailConfigStatus(): Promise<string> {
        return await fetchFromApi('/auth/email-config-status');
    },
};
