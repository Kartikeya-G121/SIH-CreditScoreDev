import { fetchFromApi } from '@/lib/api';

export interface Scheme {
    schemeId: number;
    schemeName: string;
    providerName?: string;
    loanCategory?: string;
    minAmount: number;
    maxAmount: number;
    baseInterestRate: number;
    minTenureMonths: number;
    maxTenureMonths: number;
    isTieredInterest: boolean;
    tierThreshold?: number;
    tierInterestRate?: number;
    isActive: boolean;
    createdAt: string;

    // New fields
    minAge?: number;
    maxAge?: number;
    genderAllowed?: string;
    casteCategory?: string;
    incomeMax?: number;
    maxExistingLoans?: number;

    isSubsidy?: boolean;
    subsidyType?: string;
    subsidyPercentage?: number;

    gracePeriodDays?: number;
    penaltyRate?: number;
    emiBounceCharges?: number;
    allowPrepayment?: boolean;
    prepaymentPenalty?: number;

    isGroupLoanAllowed?: boolean;
    createdBy?: string;
}

export const schemeService = {
    async getAllSchemes(): Promise<Scheme[]> {
        return await fetchFromApi('/schemes/all');
    },

    async getActiveSchemes(): Promise<Scheme[]> {
        return await fetchFromApi('/schemes');
    },

    async getSchemeById(id: number): Promise<Scheme> {
        return await fetchFromApi(`/schemes/${id}`);
    },

    async createScheme(data: Partial<Scheme>): Promise<Scheme> {
        return await fetchFromApi('/schemes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateScheme(id: number, data: Partial<Scheme>): Promise<Scheme> {
        return await fetchFromApi(`/schemes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async toggleScheme(id: number): Promise<Scheme> {
        return await fetchFromApi(`/schemes/${id}/toggle`, {
            method: 'PUT',
        });
    },

    async deleteScheme(id: number): Promise<void> {
        await fetchFromApi(`/schemes/${id}`, {
            method: 'DELETE',
        });
    },
};
