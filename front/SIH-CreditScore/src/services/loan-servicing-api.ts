import { fetchFromApi } from '@/lib/api';
import type {
    LoanResponse,
    LoanTransaction,
    PaymentRequest,
    RepaymentSchedule,
    PortfolioSummary
} from '@/types/loan-servicing-types';

export const loanServicingApi = {
    // User Endpoints
    async getMyLoans(): Promise<LoanResponse[]> {
        return fetchFromApi('/loans');
    },

    async getLoanById(id: number): Promise<LoanResponse> {
        return fetchFromApi(`/loans/${id}`);
    },

    async getSchedule(id: number): Promise<RepaymentSchedule[]> {
        return fetchFromApi(`/loans/${id}/projected-schedule`);
    },

    async getTransactions(id: number): Promise<LoanTransaction[]> {
        return fetchFromApi(`/loans/${id}/transactions`);
    },

    async payEmi(id: number, data: PaymentRequest): Promise<string> {
        return fetchFromApi(`/loans/${id}/payments/pay-emi`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async payOverdue(id: number, data: PaymentRequest): Promise<string> {
        return fetchFromApi(`/loans/${id}/payments/pay-overdue`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async prepayLoan(id: number, data: PaymentRequest): Promise<string> {
        return fetchFromApi(`/loans/${id}/payments/prepay`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async forecloseLoan(id: number, data: PaymentRequest): Promise<string> {
        return fetchFromApi(`/loans/${id}/payments/foreclose`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getForeclosureAmount(id: number): Promise<number> {
        return fetchFromApi(`/loans/${id}/foreclosure-amount`);
    },

    // Admin Endpoints
    async getPortfolioSummary(): Promise<PortfolioSummary> {
        return fetchFromApi('/admin/loans/portfolio-summary');
    },

    async runNightlyJob(): Promise<string> {
        return fetchFromApi('/loans/admin/run-nightly-job', {
            method: 'POST'
        });
    },
};
