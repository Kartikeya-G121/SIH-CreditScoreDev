// Beneficiary API Service Layer
// Centralized service for all beneficiary-related API calls

import { fetchFromApi } from '@/lib/api';
import type {
    BeneficiaryProfile,
    CreateProfileRequest,
    UpdateProfileRequest,
    VerifyProfileRequest,
    ApiResponse,
} from '@/types/beneficiary';

export const beneficiaryService = {
    /**
     * Get current user's beneficiary profile
     * GET /api/v1/beneficiaries/me
     */
    async getMyProfile(): Promise<BeneficiaryProfile> {
        return await fetchFromApi('/beneficiaries/me');
    },

    /**
     * Create beneficiary profile (JSON only, no files)
     * POST /api/v1/beneficiaries
     */
    async createProfile(data: CreateProfileRequest): Promise<BeneficiaryProfile> {
        return await fetchFromApi('/beneficiaries', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Create beneficiary profile with file uploads (multipart/form-data)
     * POST /api/v1/beneficiaries/complete-profile
     */
    async createProfileWithFiles(
        data: CreateProfileRequest,
        casteCertificate?: File,
        identityProof?: File
    ): Promise<BeneficiaryProfile> {
        const formData = new FormData();

        // Append all text fields
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        // Append files if provided
        if (casteCertificate) {
            formData.append('casteCertificate', casteCertificate);
        }
        if (identityProof) {
            formData.append('identityProof', identityProof);
        }

        return await fetchFromApi('/beneficiaries/complete-profile', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - browser will set it with boundary
            headers: {},
        });
    },

    /**
     * Update current user's profile
     * PUT /api/v1/beneficiaries/me
     */
    async updateProfile(data: UpdateProfileRequest): Promise<BeneficiaryProfile> {
        return await fetchFromApi('/beneficiaries/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update profile with file uploads (multipart/form-data)
     * PUT /api/v1/beneficiaries/me/with-files
     */
    async updateProfileWithFiles(
        data: UpdateProfileRequest,
        casteCertificate?: File,
        identityProof?: File
    ): Promise<BeneficiaryProfile> {
        const formData = new FormData();

        // Append all text fields
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        // Append files if provided
        if (casteCertificate) {
            formData.append('casteCertificate', casteCertificate);
        }
        if (identityProof) {
            formData.append('identityProof', identityProof);
        }

        return await fetchFromApi('/beneficiaries/me/with-files', {
            method: 'PUT',
            body: formData,
            headers: {},
        });
    },

    /**
     * Upload caste certificate
     * POST /api/v1/beneficiaries/upload-certificate
     */
    async uploadCasteCertificate(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        return await fetchFromApi('/beneficiaries/upload-certificate', {
            method: 'POST',
            body: formData,
            headers: {},
        });
    },

    /**
     * Upload identity proof document
     * POST /api/v1/beneficiaries/upload-identity
     */
    async uploadIdentityProof(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        return await fetchFromApi('/beneficiaries/upload-identity', {
            method: 'POST',
            body: formData,
            headers: {},
        });
    },

    /**
     * Download caste certificate
     * GET /api/v1/beneficiaries/certificate/download
     */
    async downloadCertificate(): Promise<Blob> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        const token = localStorage.getItem('credit-assist-token');

        const response = await fetch(`${API_URL}/beneficiaries/certificate/download`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download certificate');
        }

        return response.blob();
    },

    /**
     * Download identity proof document
     * GET /api/v1/beneficiaries/identity/download
     */
    async downloadIdentityProof(): Promise<Blob> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        const token = localStorage.getItem('credit-assist-token');

        const response = await fetch(`${API_URL}/beneficiaries/identity/download`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download identity proof');
        }

        return response.blob();
    },

    /**
     * Get beneficiary profile by ID (for officers/admins)
     * GET /api/v1/beneficiaries/{id}
     */
    async getProfileById(id: number): Promise<BeneficiaryProfile> {
        return await fetchFromApi(`/beneficiaries/${id}`);
    },

    /**
     * Search beneficiary profiles (for admins)
     * GET /api/v1/beneficiaries?state=...&district=...&pincode=...
     */
    async searchProfiles(params?: {
        state?: string;
        district?: string;
        pincode?: string;
    }): Promise<BeneficiaryProfile[]> {
        const queryParams = new URLSearchParams();

        if (params?.state) queryParams.append('state', params.state);
        if (params?.district) queryParams.append('district', params.district);
        if (params?.pincode) queryParams.append('pincode', params.pincode);

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/beneficiaries?${queryString}` : '/beneficiaries';

        return await fetchFromApi(endpoint);
    },

    /**
     * Verify beneficiary profile (for officers)
     * PUT /api/v1/beneficiaries/{id}/verify
     */
    async verifyProfile(
        id: number,
        data: VerifyProfileRequest
    ): Promise<BeneficiaryProfile> {
        return await fetchFromApi(`/beneficiaries/${id}/verify`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};
