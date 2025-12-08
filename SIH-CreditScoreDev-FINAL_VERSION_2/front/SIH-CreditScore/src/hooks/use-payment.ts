import { useState } from 'react';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { toast } from '@/hooks/use-toast';
import { PaymentRequest } from '@/types/loan-servicing-types';

export function usePayment() {
    const [processing, setProcessing] = useState(false);

    const payEmi = async (loanId: number, req: PaymentRequest, onSuccess?: () => void) => {
        setProcessing(true);
        try {
            const res = await loanServicingApi.payEmi(loanId, req);
            toast({ title: 'Success', description: 'EMI Payment Successful!' });
            onSuccess?.();
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Payment failed";
            toast({ variant: 'destructive', title: 'Payment Failed', description: msg });
            throw err;
        } finally {
            setProcessing(false);
        }
    };

    const payOverdue = async (loanId: number, req: PaymentRequest, onSuccess?: () => void) => {
        setProcessing(true);
        try {
            const res = await loanServicingApi.payOverdue(loanId, req);
            toast({ title: 'Success', description: 'Overdue Payment Successful!' });
            onSuccess?.();
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Payment failed";
            toast({ variant: 'destructive', title: 'Payment Failed', description: msg });
            throw err;
        } finally {
            setProcessing(false);
        }
    };

    const prepay = async (loanId: number, amount: number, onSuccess?: () => void) => {
        setProcessing(true);
        try {
            await loanServicingApi.prepayLoan(loanId, {
                amount,
                mode: 'ONLINE',
                transactionRef: 'Prepayment',
                adjustmentMode: 'TENURE_REDUCTION' // Explicitly setting default
            });
            toast({ title: 'Success', description: 'Prepayment Successful! Schedule updated.' });
            onSuccess?.();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Prepayment failed";
            toast({ variant: 'destructive', title: 'Error', description: msg });
        } finally {
            setProcessing(false);
        }
    };

    const foreclose = async (loanId: number, amount: number, onSuccess?: () => void) => {
        setProcessing(true);
        try {
            await loanServicingApi.forecloseLoan(loanId, {
                amount,
                mode: 'ONLINE',
                transactionRef: 'Foreclosure Settlement'
            });
            toast({ title: 'Loan Closed', description: 'Foreclosure Successful.' });
            onSuccess?.();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Foreclosure failed";
            toast({ variant: 'destructive', title: 'Error', description: msg });
        } finally {
            setProcessing(false);
        }
    };

    return { payEmi, payOverdue, prepay, foreclose, processing };
}
