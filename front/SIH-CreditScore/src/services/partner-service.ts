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

export const partnerService = {
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
