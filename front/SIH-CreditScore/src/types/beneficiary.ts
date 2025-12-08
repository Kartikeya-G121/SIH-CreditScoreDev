// TypeScript type definitions for Beneficiary module
// Matches backend DTOs from com.sih.module.beneficiary.dto

// ProfileResponse - matches backend ProfileResponse.java
export interface BeneficiaryProfile {
    profileId: number;
    userId: number;
    fullName: string;
    casteCategory?: string;
    dob?: string;
    gender?: string;
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
    regionType: 'RURAL' | 'URBAN';
    geoLat?: number;
    geoLong?: number;
    literacyScore?: number;
    verifiedAnnualIncome?: number;
    creditScore?: number;
    riskLevel?: string;
    isProfileVerified: boolean;
    verifiedBy?: number;
    casteCertificateUrl?: string;
    identityProofType?: string;
    identityProofUrl?: string;
    // Socio-economic fields
    education?: string;
    familySize?: number;
    dependencyCount?: number;
    landOwned?: number;
    incomeSource?: string;
    isGraduate?: boolean;
    compositeScore?: number;
    scoreTimestamp?: string;
    createdAt: string;
    updatedAt: string;
}

// CreateProfileRequest - matches backend CreateProfileRequest.java
export interface CreateProfileRequest {
    fullName: string;
    casteCategory?: string;
    dob: string;
    gender?: string;
    addressLine: string;
    district: string;
    state: string;
    pincode: string;
    regionType: 'RURAL' | 'URBAN';
    geoLat?: number;
    geoLong?: number;
    literacyScore?: number;
    identityProofType?: string;
    // Socio-economic fields
    education?: string;
    familySize?: number;
    dependencyCount?: number;
    landOwned?: number;
    incomeSource?: string;
    isGraduate?: boolean;
}

// UpdateProfileRequest - matches backend UpdateProfileRequest.java
// UpdateProfileRequest - matches backend UpdateProfileRequest.java
export interface UpdateProfileRequest {
    fullName?: string;
    casteCategory?: string;
    dob?: string;
    gender?: string;
    addressLine?: string;
    district?: string;
    state?: string;
    pincode?: string;
    regionType?: 'RURAL' | 'URBAN';
    geoLat?: number;
    geoLong?: number;
    literacyScore?: number;
    // Socio-economic fields
    education?: string;
    familySize?: number;
    dependencyCount?: number;
    landOwned?: number;
    incomeSource?: string;
    isGraduate?: boolean;
}

// VerifyRequest - matches backend VerifyRequest.java
export interface VerifyProfileRequest {
    verifiedAnnualIncome: number;
    remarks?: string;
}

// API Response wrapper - matches backend ApiResponse.java
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}
