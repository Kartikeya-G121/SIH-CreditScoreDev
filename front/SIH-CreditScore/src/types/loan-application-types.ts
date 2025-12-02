export type LoanType = 'INDIVIDUAL' | 'GROUP';

export interface ConsentData {
  loanType: LoanType;
  groupId?: number;
  agreedToTerms: boolean;
  consentTimestamp: string;
  ipAddress?: string;
}

export interface ApplicationStatus {
  hasActiveApplication: boolean;
  applicationId?: number;
  status?: string;
  groupId?: number;
}

export interface LoanApplicationRequest {
  loanType: LoanType;
  groupId?: number;
  schemeId?: number;
  requestedAmount?: number;
  tenureMonths?: number;
}

// ==================== Multi-Step Application Types ====================

// Step 1: Application Form Data
export interface ApplicationFormData {
  schemeId: number;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  groupId?: number;
}

// Step 2: Beneficiary Details (read-only review)
export interface BeneficiaryDetailsData {
  fullName: string;
  addressLine: string;
  district: string;
  state: string;
  pincode: string;
  regionType: 'RURAL' | 'URBAN';
  casteCategory?: string;
  casteCertificateUrl?: string;
  identityProofUrl?: string;
}

// Step 3: Consumption/Bill Upload
export enum BillCategory {
  ELECTRICITY = 'ELECTRICITY',
  GAS = 'GAS',
  WATER = 'WATER',
  TELEPHONE = 'TELEPHONE',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER'
}

export interface BillUploadData {
  category: BillCategory;
  file: File;
  billingDate?: string;
  billingAmount?: number;
}

export interface ConsumptionEntry {
  entryId: number;
  userId: number;
  dataSource: string;
  billingAmount: number;
  billingDate: string;
  unitsConsumed?: number;
  uploadMetadata?: Record<string, any>;
  isTamperedFlag?: boolean;
  tamperReason?: string;
  isImputed?: boolean;
  verificationStatus?: string;
  verificationSource?: string;
  verificationConfidence?: number;
  verifiedBy?: number;
  fileS3Url?: string;
  createdAt: string;
}

export interface BillsByCategoryData {
  category: BillCategory;
  existingBills: ConsumptionEntry[];
  remainingSlots: number;
}

export interface ApplicationResponse {
  applicationId: number;
  userId: number;
  groupId?: number;
  schemeId?: number;
  requestedAmount: number;
  purpose?: string;
  tenureMonths?: number;
  status: string; // 'DRAFT', 'SUBMITTED', 'SCORING', 'APPROVED', 'REJECTED', 'SANCTIONED', 'WITHDRAWN'
  rejectionReason?: string;
  stageTimestamp: string;
  sanctionedAmount?: number;
  finalInterestRate?: number;
  sanctionedBy?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== Application Workflow State ====================

export interface ApplicationWorkflowState {
  currentStep: 1 | 2 | 3 | 4;
  applicationId?: number;
  formData: ApplicationFormData | null;
  beneficiaryData: BeneficiaryDetailsData | null;
  billsData: BillsByCategoryData[];
  preSelectedSchemeId?: number;
  createdAt?: string;
}

export interface ApplicationDraftRequest {
  schemeId: number;
  requestedAmount: number;
  purpose: string;
  tenureMonths: number;
  groupId?: number;
}

export interface GroupMemberApplicationStatus {
  userId: number;
  userName: string;
  role: 'LEADER' | 'MEMBER';
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'SCORING' | 'APPROVED' | 'REJECTED' | 'SANCTIONED' | 'WITHDRAWN';
  amount?: number;
  applicationId?: number;
}

export interface GroupApplicationStatus {
  groupId: number;
  groupName: string;
  leaderName: string;
  canSubmit: boolean;
  members: GroupMemberApplicationStatus[];
}

export interface GroupApplicationStatusResponse {
  userId: number;
  userName: string;
  role: 'LEADER' | 'MEMBER';
  status: 'NOT_APPLIED' | 'DRAFT' | 'SUBMITTED' | 'SCORING' | 'APPROVED' | 'REJECTED' | 'SANCTIONED' | 'WITHDRAWN';
  applicationId: number | null;
}
