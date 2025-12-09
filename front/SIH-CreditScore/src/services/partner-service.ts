import { fetchFromApi } from '@/lib/api';

export interface PartnerRequest {
    id: number;
    officialOrganizationEmail: string;
    contactPersonName: string;
    gmailForLogin: string;
    mobile: string;
    note: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt?: string;
    updatedAt?: string;
}

export interface PartnerAnalytics {
    totalPartners: number;
    pendingRequests: number;
    // ... other stats
}

export interface PartnerRequestDTO {
    contactPersonName: string;
    gmailForLogin: string;
    officialOrganizationEmail: string;
    mobile?: string;
    note?: string;
}

export interface BulkUploadResult {
    totalRows: number;
    usersCreated: number;
    profilesUpdated: number;
    failedRows: number;
    errors: string[];
}

export const partnerService = {
    bulkUploadBeneficiaries: async (files: File[]): Promise<BulkUploadResult> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(`http://localhost:8080/api/v1/partner/beneficiaries/bulk-upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            console.log('Upload response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);

                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || `Upload failed: ${response.status}`);
                } catch (e) {
                    throw new Error(`Upload failed: ${response.status} - ${errorText.substring(0, 100)}`);
                }
            }

            const result = await response.json();
            console.log('Upload result:', result);
            return result.data;
        } catch (error: any) {
            console.error('Upload error:', error);
            throw error;
        }
    },
    createOnboardingRequest: async (data: PartnerRequestDTO) => {
        return await fetchFromApi('/auth/partner/register', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
    },
    getRequests: async (status: string = 'PENDING', page: number = 0, size: number = 10) => {
        // Backend returns Page<PartnerAccountRequest> directly, or wrapped in ApiResponse
        // fetchFromApi unwraps ApiResponse.data if present.
        const response = await fetchFromApi(`/admin/partner/requests?status=${status}&page=${page}&size=${size}`);
        return { success: true, data: response };
    },

    approveRequest: async (id: number) => {
        return await fetchFromApi(`/admin/partner/approve/${id}`, { method: 'POST' });
    },

    rejectRequest: async (id: number) => {
        return await fetchFromApi(`/admin/partner/reject/${id}`, { method: 'POST' });
    },

    getAnalytics: async () => {
        try {
            const pendingPromise = fetchFromApi('/admin/partner/requests?status=PENDING&size=1');
            const approvedPromise = fetchFromApi('/admin/partner/requests?status=APPROVED&size=1');

            const [pendingRes, approvedRes] = await Promise.all([pendingPromise, approvedPromise]);

            // Assuming response structure is Page object with totalElements
            const pendingCount = pendingRes?.totalElements || 0;
            const approvedCount = approvedRes?.totalElements || 0;

            return {
                pendingRequests: pendingCount,
                totalPartners: approvedCount,
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return {
                pendingRequests: 0,
                totalPartners: 0,
            };
        }
    }
};
