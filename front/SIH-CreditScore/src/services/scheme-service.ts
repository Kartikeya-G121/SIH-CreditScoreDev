import { fetchFromApi } from '@/lib/api';
import type {
    SchemeResponse,
    SchemeRequest,
    SchemeListResponse,
    StatusResponse,
    RegionListResponse,
    RegionRequest,
    RegionResponse,
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

    /**
     * Delete scheme (Admin only)
     * DELETE /api/v1/schemes/{id}
     */
    async deleteScheme(id: number): Promise<StatusResponse> {
        const response = await fetchFromApi(`/schemes/${id}`, {
            method: 'DELETE',
        });
        return response.data;
    },

    /**
     * Get regional parameters (Admin only)
     * GET /api/v1/admin/regional-parameters
     */
    async getRegionalParameters(): Promise<RegionListResponse> {
        const response = await fetchFromApi('/admin/regional-parameters');
        if (Array.isArray(response.data)) {
            return { regions: response.data };
        }
        return response.data;
    },

    /**
     * Add regional parameter (Admin only)
     * POST /api/v1/admin/regional-parameters
     */
    async addRegionalParameter(data: RegionRequest): Promise<RegionResponse> {
        const response = await fetchFromApi('/admin/regional-parameters', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Update regional parameter (Admin only)
     * PUT /api/v1/admin/regional-parameters/{id}
     */
    async updateRegionalParameter(id: number, data: RegionRequest): Promise<RegionResponse> {
        const response = await fetchFromApi(`/admin/regional-parameters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },
};
