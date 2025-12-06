import { fetchFromApi } from '@/lib/api';

export interface ApplicationStats {
    totalApplications: number;
    draftCount: number;
    submittedCount: number;
    scoringCount: number;
    approvedCount: number;
    rejectedCount: number;
    sanctionedCount: number;
    withdrawnCount: number;
}

export interface StateApplicationStats {
    state: string;
    totalApplications: number;
    submittedCount: number;
    scoringCount: number;
    approvedCount: number;
    rejectedCount: number;
    sanctionedCount: number;
    totalAmountRequested: number;
}

export interface ApplicationAnalyticsResponse {
    overallStats: ApplicationStats;
    stateWiseStats: StateApplicationStats[];
    lastUpdated: string;
    isCached: boolean;
}

export interface ApplicationSearchRequest {
    searchText?: string;
    status?: string;
    state?: string;
    schemeId?: number;
    createdAfter?: string;
    createdBefore?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
    minAmount?: number;
    maxAmount?: number;
    providerName?: string;
    schemeName?: string;
}

export interface ApplicationDetail {
    applicationId: number;
    userId: number;
    userName: string | null;
    userEmail: string;
    userPhone: string;
    state: string | null;
    district: string | null;
    groupId: number | null;
    groupName: string | null;
    schemeId: number | null;
    schemeName: string | null;
    requestedAmount: number;
    purpose: string;
    tenureMonths: number;
    status: string;
    rejectionReason: string | null;
    stageTimestamp: string;
    sanctionedAmount: number | null;
    finalInterestRate: number | null;
    sanctionedBy: number | null;
    sanctionedByName: string | null;
    interestRate?: number;
    processingFee?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ApplicationSearchResponse {
    applications: ApplicationDetail[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export const applicationAnalyticsService = {
    async getAnalytics(): Promise<ApplicationAnalyticsResponse> {
        return await fetchFromApi('/admin/applications/analytics');
    },

    async refreshCache(): Promise<ApplicationAnalyticsResponse> {
        return await fetchFromApi('/admin/applications/refresh-cache', {
            method: 'POST',
        });
    },

    async searchApplications(request: ApplicationSearchRequest): Promise<ApplicationSearchResponse> {
        return await fetchFromApi('/admin/applications/search', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },
};
