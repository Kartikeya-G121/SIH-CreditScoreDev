// ML Explanation Types
export interface RiskFactor {
    name: string;
    impact: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' | 'VERY_GOOD' | 'GOOD' | 'NEUTRAL';
    shapValue: number;
    description: string;
}

export interface RiskModel {
    score: number;
    category: string;
    topFactors: RiskFactor[];
    modelVersion: string;
    timestamp: string;
}

export interface IncomeModel {
    predictedCategory: string;
    confidence: number;
    probabilities?: {
        LOW_INCOME?: number;
        MEDIUM_INCOME?: number;
        HIGH_INCOME?: number;
    };
}

export interface ScoreTrend {
    previousScore: number;
    change: number;
    changePercent: number;
    period: string;
}

export interface MLExplanations {
    riskModel?: RiskModel;
    incomeModel?: IncomeModel;
    compositeScore: number;
    scoreTrend?: ScoreTrend;
}

// Update BeneficiaryProfile type to include ML explanations
export interface BeneficiaryProfileWithExplanations {
    profileId: number;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    addressLine?: string;
    district?: string;
    state?: string;
    pincode?: string;
    regionType?: string;
    casteCategory?: string;
    dob?: string;
    gender?: string;
    verifiedAnnualIncome?: number;
    literacyScore?: number;
    isProfileVerified?: boolean;
    casteCertificateUrl?: string;
    identityProofUrl?: string;
    education?: string;
    familySize?: number;
    dependencyCount?: number;
    landOwned?: number;
    incomeSource?: string;
    isGraduate?: boolean;
    riskBucket?: string;
    incomeBucket?: string;
    compositeScore?: number;
    scoreTimestamp?: string;
    mlExplanations?: string; // JSON string that needs to be parsed
}
