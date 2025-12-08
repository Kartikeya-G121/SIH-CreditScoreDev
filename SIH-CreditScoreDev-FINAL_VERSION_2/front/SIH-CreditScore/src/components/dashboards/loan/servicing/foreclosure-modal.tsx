import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { useToast } from '@/hooks/use-toast';
import { LoanResponse } from '@/types/loan-servicing-types';

interface ForeclosureModalProps {
    loan: LoanResponse;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ForeclosureModal({ loan, open, onOpenChange, onSuccess }: ForeclosureModalProps) {
    const [payoffAmount, setPayoffAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadPayoffAmount();
        }
    }, [open]);

    const loadPayoffAmount = async () => {
        try {
            const amt = await loanServicingApi.getForeclosureAmount(loan.loanId);
            setPayoffAmount(amt);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch foreclosure amount'
            });
        }
    };

    const handleForeclose = async () => {
        if (!payoffAmount) return;
        try {
            setLoading(true);
            await loanServicingApi.forecloseLoan(loan.loanId, {
                amount: payoffAmount,
                mode: 'ONLINE',
                transactionRef: `FORECLOSE-${Date.now()}`
            });

            toast({
                title: 'Loan Foreclosed',
                description: 'Your loan has been successfully closed.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Foreclosure Failed',
                description: error?.response?.data?.message || 'Transaction failed',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Foreclose Loan
                    </DialogTitle>
                    <DialogDescription>
                        Pay off your entire loan amount including charges to close this account permanently.
                    </DialogDescription>
                </DialogHeader>

                {payoffAmount === null ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Outstanding Principal</span>
                                <span className="font-semibold">₹{(loan.outstandingPrincipal ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Outstanding Penalty</span>
                                <span className="font-semibold">₹{(loan.outstandingPenalty ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Accrued Interest</span>
                                <span className="font-semibold">
                                    {/* Ideally separate field, but using approximate or hidden logic if not in details yet */}
                                    -
                                </span>
                            </div>
                            {loan.foreclosurePenaltyRate > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Foreclosure Charges ({loan.foreclosurePenaltyRate}%)</span>
                                    <span className="font-semibold">
                                        ₹{((loan.outstandingPrincipal * loan.foreclosurePenaltyRate) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-red-200 mt-2 pt-2 flex justify-between text-lg font-bold text-red-800">
                                <span>Total Payoff Amount</span>
                                <span>₹{(payoffAmount ?? 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <p className="text-xs text-center text-gray-500">
                            By clicking confirm, the total amount will be deducted and loan will be marked as closed.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleForeclose}
                        disabled={loading || !payoffAmount}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Foreclosure'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
