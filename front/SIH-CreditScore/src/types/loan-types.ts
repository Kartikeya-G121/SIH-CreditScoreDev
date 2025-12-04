// Loan Type Definitions
export interface Loan {
    loanId: number;
    applicationId: number;
    userId: number;
    totalPrincipal: number;
    totalInterest: number;
    monthlyEmi: number;
    outstandingPrincipal: number;
    outstandingInterest: number;
    startDate: string;
    endDate: string;
    loanStatus: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'DEFAULTED' | 'FORECLOSED' | 'WAIVED_OFF';
    nextPaymentDate: string | null;
    createdAt: string;
    updatedAt: string;
    isGroupLoan: boolean;
    groupId?: number;
    groupName?: string;
    groupStatus?: string;
}

export interface RepaymentScheduleItem {
    installmentNumber: number;
    dueDate: string;
    emiAmount: number;
    principalComponent: number;
    interestComponent: number;
    outstandingPrincipal: number;
    status: 'PAID' | 'UPCOMING' | 'OVERDUE';
}

export interface Repayment {
    repaymentId: number;
    dueDate: string;
    paidDate: string | null;
    amountDue: number;
    amountPaid: number;
    principalComponent: number;
    interestComponent: number;
    paymentMode: string;
    transactionRef: string;
    isOnTime: boolean;
    delayDays: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
}

export interface PaymentRequest {
    amount: number;
    mode: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'ONLINE';
    transactionRef?: string;
    adjustmentMode?: 'TENURE_REDUCTION' | 'EMI_REDUCTION';
}

export interface LoanSummary {
    totalLoans: number;
    activeLoans: number;
    totalBorrowed: number;
    totalRepaid: number;
    totalOutstanding: number;
    nextPaymentDue: number;
    nextPaymentDate: string | null;
}
