import { fetchFromApi } from '@/lib/api';

export interface RiskBucketStats {
    riskBucket: string;
    loanCount: number;
    totalPrincipal: number;
    percentageOfBook: number;
}

export interface StatePerformanceStats {
    state: string;
    activeLoans: number;
    totalAum: number;
    npaAmount: number;
    npaRate: number;
}

export interface SchemePerformanceStats {
    schemeId: number;
    schemeName: string;
    isActive: boolean;
    activeLoans: number;
    totalAum: number;
    npaRate: number;
    averageRoi: number;
}

export interface ProviderPerformanceStats {
    providerName: string;
    totalSchemes: number;
    activeLoans: number;
    totalAum: number;
    npaRate: number;
    averageRoi: number;
    totalDisbursed: number;
}

export interface DemographicsStats {
    category: string;
    type: 'GENDER' | 'AGE_GROUP' | 'LOCATION';
    count: number;
    percentage: number;
}

export interface PortfolioAnalyticsResponse {
    totalAum: number;
    activeLoansCount: number;
    npaRate: number;
    parRate: number;
    collectionEfficiency: number;
    riskDistribution: RiskBucketStats[];
    statePerformance: StatePerformanceStats[];
    schemePerformance: SchemePerformanceStats[];
    providerPerformance: ProviderPerformanceStats[];
    genderDistribution: DemographicsStats[];
    ageDistribution: DemographicsStats[];
}

export interface LoanResponse {
    loanId: number;
    applicationId: number;
    userId: number;
    totalPrincipal: number;
    totalInterest: number;
    monthlyEmi: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    loanStatus: string;
    nextPaymentDate: string;
    riskBucket: string;
    dpd: number;
    interestRate: number;
    userName: string;
    userEmail: string;
    createdAt: string;
}

export interface LoanSearchCriteria {
    query?: string;
    status?: string;
    state?: string;
    riskBucket?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string; // YYYY-MM-DD
    endDate?: string;
    isNpa?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const loanPortfolioService = {
    async getPortfolioAnalytics(): Promise<PortfolioAnalyticsResponse> {
        return await fetchFromApi('/admin/loans/analytics/portfolio');
    },

    async refreshCache(): Promise<void> {
        return await fetchFromApi('/admin/loans/analytics/refresh-cache', {
            method: 'POST',
        });
    },

    async toggleScheme(schemeId: number): Promise<void> {
        return await fetchFromApi(`/schemes/${schemeId}/toggle`, {
            method: 'PUT'
        });
    },

    async searchLoans(criteria: LoanSearchCriteria): Promise<PageResponse<LoanResponse>> {
        const params = new URLSearchParams();
        Object.entries(criteria).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
        return await fetchFromApi(`/admin/loans?${params.toString()}`);
    },

    async getProjectedSchedule(loanId: number): Promise<any[]> {
        return await fetchFromApi(`/loans/${loanId}/projected-schedule`);
    }
};
