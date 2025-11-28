import { fetchFromApi } from '@/lib/api';
import type {
    SchemeResponse,
    SchemeRequest,
    SchemeListResponse,
    StatusResponse,
} from '@/types/scheme-types';

export const schemeService = {
    /**
     * Get all active schemes (Public/User)
     * GET /api/v1/schemes
     */
    async getActiveSchemes(): Promise<SchemeListResponse> {
        const response = await fetchFromApi('/schemes');
        if (Array.isArray(response.data)) {
            return { schemes: response.data };
        }
        return response.data;
    },

    /**
     * Get all schemes (Admin only)
     * GET /api/v1/schemes/all
     */
    async getAllSchemes(): Promise<SchemeListResponse> {
        const response = await fetchFromApi('/schemes/all');
        if (Array.isArray(response.data)) {
            return { schemes: response.data };
        }
        return response.data;
    },

    /**
     * Get scheme details by ID
     * GET /api/v1/schemes/{id}
     */
    async getSchemeById(id: number): Promise<SchemeResponse> {
        const response = await fetchFromApi(`/schemes/${id}`);
        return response.data;
    },

    /**
     * Create new scheme (Admin only)
     * POST /api/v1/schemes
     */
    async createScheme(data: SchemeRequest): Promise<SchemeResponse> {
        const response = await fetchFromApi('/schemes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Update scheme (Admin only)
     * PUT /api/v1/schemes/{id}
     */
    async updateScheme(id: number, data: SchemeRequest): Promise<SchemeResponse> {
        const response = await fetchFromApi(`/schemes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Toggle scheme active status (Admin only)
     * PUT /api/v1/schemes/{id}/toggle
     */
    async toggleScheme(id: number): Promise<SchemeResponse> {
        const response = await fetchFromApi(`/schemes/${id}/toggle`, {
            method: 'PUT',
        });
        return response.data;
    },
};
