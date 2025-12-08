// Feature Flag API Service Layer
// Centralized service for feature flag management (Admin only)

import { fetchFromApi } from '@/lib/api';
import type {
    FeatureFlagResponse,
    FeatureFlagUpdateRequest,
} from '@/types/auth-types';

export const featureFlagService = {
    /**
     * List all feature flags (Admin only)
     * GET /api/v1/admin/feature-flags
     */
    async listFlags(): Promise<FeatureFlagResponse[]> {
        return await fetchFromApi('/admin/feature-flags');
    },

    /**
     * Update feature flag (Admin only)
     * PUT /api/v1/admin/feature-flags/{name}
     */
    async updateFlag(
        flagName: string,
        data: FeatureFlagUpdateRequest
    ): Promise<FeatureFlagResponse> {
        return await fetchFromApi(`/admin/feature-flags/${flagName}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};
