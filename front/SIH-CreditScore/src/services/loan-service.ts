import { fetchFromApi } from '@/lib/api';
import type {
    Loan,
    RepaymentScheduleItem,
    Repayment,
    PaymentRequest,
    LoanSummary
} from '@/types/loan-types';

// API helper functions
const api = {
    get: async (endpoint: string) => {
        return fetchFromApi(endpoint, { method: 'GET' });
    },
    post: async (endpoint: string, data?: any) => {
        return fetchFromApi(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

export const loanService = {
    /**
     * Get all loans for the current user
     */
    async getMyLoans(): Promise<Loan[]> {
        return await api.get('/loans');
    },

    /**
     * Get only active loans (ACTIVE or OVERDUE status)
     */
    async getActiveLoans(): Promise<Loan[]> {
        return await api.get('/loans/active');
    },

    /**
     * Get a specific loan by ID
     */
    async getLoanById(loanId: number): Promise<Loan> {
        return await api.get(`/loans/${loanId}`);
    },

    /**
     * Get past repayment history for a loan
     */
    async getRepaymentHistory(loanId: number): Promise<Repayment[]> {
        return await api.get(`/loans/${loanId}/schedule`);
    },

    /**
     * Get full projected repayment schedule (past + future)
     */
    async getProjectedSchedule(loanId: number): Promise<RepaymentScheduleItem[]> {
        return await api.get(`/loans/${loanId}/projected-schedule`);
    },

    /**
     * Calculate the total payoff amount for foreclosure
     */
    async calculatePayoffAmount(loanId: number): Promise<number> {
        return await api.get(`/loans/${loanId}/payoff-amount`);
    },

    /**
     * Make a payment towards a loan
     */
    async makePayment(loanId: number, paymentData: PaymentRequest): Promise<void> {
        await api.post(`/loans/${loanId}/repay`, paymentData);
    },

    /**
     * Foreclose a loan (pay off completely)
     */
    async forecloseLoan(loanId: number): Promise<void> {
        await api.post(`/loans/${loanId}/foreclose`);
    },

    /**
     * Calculate loan summary statistics
     */
    async getLoanSummary(): Promise<LoanSummary> {
        const loans = await this.getMyLoans();

        const activeLoans = loans.filter(l =>
            l.loanStatus === 'ACTIVE' || l.loanStatus === 'OVERDUE'
        );

        const totalBorrowed = loans.reduce((sum, loan) => sum + loan.totalPrincipal, 0);
        const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstandingPrincipal, 0);
        const totalRepaid = totalBorrowed - totalOutstanding;

        // Find next payment
        const upcomingPayments = activeLoans
            .filter(l => l.nextPaymentDate)
            .map(l => ({
                date: new Date(l.nextPaymentDate!),
                amount: l.monthlyEmi
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const nextPayment = upcomingPayments[0];

        return {
            totalLoans: loans.length,
            activeLoans: activeLoans.length,
            totalBorrowed,
            totalRepaid,
            totalOutstanding,
            nextPaymentDue: nextPayment?.amount || 0,
            nextPaymentDate: nextPayment?.date.toISOString() || null,
        };
    },
};
