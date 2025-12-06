import { create } from 'zustand';
import { LoanResponse, RepaymentSchedule, LoanTransaction } from '@/types/loan-servicing-types';

interface LoanState {
    loans: LoanResponse[];
    selectedLoan: LoanResponse | null;
    schedule: RepaymentSchedule[];
    transactions: LoanTransaction[];
    loading: boolean;
    error: string | null;

    setLoans: (loans: LoanResponse[]) => void;
    setSelectedLoan: (loan: LoanResponse | null) => void;
    setSchedule: (schedule: RepaymentSchedule[]) => void;
    setTransactions: (transactions: LoanTransaction[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useLoanStore = create<LoanState>((set) => ({
    loans: [],
    selectedLoan: null,
    schedule: [],
    transactions: [],
    loading: false,
    error: null,

    setLoans: (loans) => set({ loans }),
    setSelectedLoan: (selectedLoan) => set({ selectedLoan }),
    setSchedule: (schedule) => set({ schedule }),
    setTransactions: (transactions) => set({ transactions }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}));
