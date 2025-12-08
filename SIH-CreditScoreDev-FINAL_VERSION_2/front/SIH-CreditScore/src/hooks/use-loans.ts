import { useEffect } from 'react';
import { useLoanStore } from '@/store/loan-store';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { toast } from '@/hooks/use-toast';

export function useLoans(activeOnly: boolean = false) {
    const { loans, setLoans, setLoading, setError, loading, error } = useLoanStore();

    const fetchLoans = async () => {
        try {
            setLoading(true);
            setError(null);
            // Assuming loanServicingApi has a method to fetch list. 
            // If not, we might need to use the older loanService or add a new method.
            // Using existing loanService for list fetching as per previous implementation logic
            const { loanService } = await import('@/services/loan-service');
            const data = activeOnly
                ? await loanService.getActiveLoans()
                : await loanService.getMyLoans();

            // Map old Loan type to LoanResponse if necessary, or ensure types align.
            // For now assuming the types are compatible enough for display
            setLoans(data as any);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to fetch loans";
            setError(msg);
            toast({ variant: 'destructive', title: 'Error', description: msg });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [activeOnly]);

    return { loans, loading, error, refetch: fetchLoans };
}
