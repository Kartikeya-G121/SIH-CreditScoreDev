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
        const response = await fetchFromApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Login with email/phone and password
     * POST /api/v1/auth/login
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await fetchFromApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Verify OTP after registration
     * POST /api/v1/auth/verify-otp
     */
    async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
        const response = await fetchFromApi('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Resend OTP to phone/email
     * POST /api/v1/auth/resend-otp
     */
    async resendOtp(phoneNumber: string): Promise<void> {
        await fetchFromApi('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber }),
        });
    },

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh-token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await fetchFromApi('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
        return response.data;
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
        const response = await fetchFromApi('/auth/email-config-status');
        return response.data;
    },
};
