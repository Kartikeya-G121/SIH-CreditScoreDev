// User Management API Service Layer
// Centralized service for all user-related API calls

import { fetchFromApi } from '@/lib/api';
import type { UserProfileResponse } from '@/types/auth-types';

export const userService = {
    /**
     * Get current user's profile
     * GET /api/v1/users/me
     */
    async getProfile(): Promise<UserProfileResponse> {
        return await fetchFromApi('/users/me');
    },
};