import { useEffect, useCallback } from 'react';
import { useLoanStore } from '@/store/loan-store';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { toast } from '@/hooks/use-toast';

export function useLoan(loanId: number) {
    const {
        selectedLoan,
        schedule,
        transactions,
        loading,
        setLoading,
        setSelectedLoan,
        setSchedule,
        setTransactions,

        setError,
        error
    } = useLoanStore();

    const fetchLoanDetails = useCallback(async () => {
        if (!loanId) return;

        try {
            setLoading(true);
            const [loanData, scheduleData, txnData] = await Promise.all([
                loanServicingApi.getLoanById(loanId),
                loanServicingApi.getSchedule(loanId),
                loanServicingApi.getTransactions(loanId)
            ]);

            console.log('🔍 Loan Data:', loanData);
            console.log('📅 Schedule Data:', scheduleData);
            console.log('💰 Transaction Data:', txnData);

            setSelectedLoan(loanData);
            setSchedule(scheduleData);
            setTransactions(txnData);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to load loan details";
            setError(msg);
            toast({ variant: 'destructive', title: 'Error', description: msg });
        } finally {
            setLoading(false);
        }
    }, [loanId, setLoading, setSelectedLoan, setSchedule, setTransactions, setError]);

    useEffect(() => {
        fetchLoanDetails();
    }, [fetchLoanDetails]);

    return {
        loan: selectedLoan,
        schedule,
        transactions,
        loading,
        error,
        refetch: fetchLoanDetails
    };
}
