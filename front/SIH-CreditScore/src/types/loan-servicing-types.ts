export interface LoanResponse {
    loanId: number;
    applicationId: number;
    userId: number;
    totalPrincipal: number;
    totalInterest: number;
    monthlyEmi: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    startDate: string; // ISO Date
    endDate: string;
    loanStatus: 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'FORECLOSED' | 'WAIVED_OFF';
    nextPaymentDate: string;
    createdAt: string;
    updatedAt: string;

    // Servicing Fields
    disbursedAmount: number;
    disbursementDate: string;
    originalTenureMonths: number;
    interestRate: number;
    dpd: number;
    riskBucket: 'CURRENT' | 'SMA_0' | 'SMA_1' | 'SMA_2' | 'NPA';
    penalInterestRate: number;
    outstandingPenalty: number;
    prepaymentPenaltyRate: number;
    foreclosureAllowed: boolean;
    foreclosurePenaltyRate: number;
    lastAccrualDate: string;

    // Group Loan Details
    isGroupLoan: boolean;
    groupId?: number;
    groupName?: string;
    groupStatus?: string;
}

export interface RepaymentSchedule {
    installmentNumber: number;
    dueDate: string;
    emiAmount: number;
    principalComponent: number;
    interestComponent: number;
    outstandingPrincipal: number;
    penaltyComponent: number;
    paidDate?: string;
    status: 'PENDING' | 'DUE' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE' | 'FAILED' | 'CANCELLED' | 'WAIVED_OFF';
}

export interface LoanTransaction {
    transactionId: number;
    loanId: number;
    txnType: 'DISBURSEMENT' | 'EMI_PAYMENT' | 'PARTIAL_PAYMENT' | 'PREPAYMENT' | 'PREPAYMENT_PENALTY' | 'FORECLOSURE_PAYMENT' | 'PENALTY_CHARGE' | 'PENALTY_REVERSAL' | 'INTEREST_ACCRUAL' | 'OTHER_CHARGE';
    amount: number;
    principalComponent: number;
    interestComponent: number;
    penaltyComponent: number;
    chargesComponent: number;
    paymentMode?: string;
    externalRef?: string;
    valueDate: string;
    createdAt: string;
}

export interface PaymentRequest {
    amount: number;
    mode: 'ONLINE' | 'CASH' | 'CHEQUE' | 'DRAFT';
    transactionRef?: string;
    adjustmentMode?: 'TENURE_REDUCTION' | 'EMI_REDUCTION';
}

export interface PortfolioSummary {
    totalLoans: number;
    activeLoans: number;
    closedLoans: number;
    totalOutstandingPrincipal: number;
    totalNpaOutstanding: number;
    npaPercentage: number;
    riskBucketCounts: Record<string, number>;
}
