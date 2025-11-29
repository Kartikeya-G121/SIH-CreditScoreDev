export interface SchemeResponse {
    schemeId: number;
    schemeName: string;
    providerName: string;
    loanCategory: string;
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
}

export interface SchemeRequest {
    schemeName: string;
    providerName?: string;
    loanCategory?: string;
    minAmount: number;
    maxAmount: number;
    baseInterestRate: number;
    minTenureMonths: number;
    maxTenureMonths: number;
    isTieredInterest?: boolean;
    tierThreshold?: number;
    tierInterestRate?: number;
}

export interface SchemeListResponse {
    schemes: SchemeResponse[];
}

export interface StatusResponse {
    success: boolean;
    message: string;
}

export interface RegionRequest {
    regionName: string;
    riskFactor: number;
    baseInterestAdjustment: number;
    maxLoanAmountAdjustment: number;
}

export interface RegionResponse {
    id: number;
    regionName: string;
    riskFactor: number;
    baseInterestAdjustment: number;
    maxLoanAmountAdjustment: number;
}

export interface RegionListResponse {
    regions: RegionResponse[];
}
