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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { useToast } from '@/hooks/use-toast';
import { LoanResponse } from '@/types/loan-servicing-types';

interface PrepaymentModalProps {
    loan: LoanResponse;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PrepaymentModal({ loan, open, onOpenChange, onSuccess }: PrepaymentModalProps) {
    const [amount, setAmount] = useState('');
    const [estimatedEmi, setEstimatedEmi] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Calculate Estimated EMI locally for preview (Simplified)
    useEffect(() => {
        const prepay = parseFloat(amount);
        if (!isNaN(prepay) && prepay > 0 && prepay < loan.outstandingPrincipal) {
            const newPrincipal = loan.outstandingPrincipal - prepay;

            // Simplified Estimation: NewEMI approx = OldEMI * (NewPrincipal / OldPrincipal)
            const ratio = newPrincipal / loan.outstandingPrincipal;
            setEstimatedEmi(Math.max(0, Math.round(loan.monthlyEmi * ratio)));
        } else {
            setEstimatedEmi(null);
        }
    }, [amount, loan]);

    const handlePrepay = async () => {
        try {
            setLoading(true);
            await loanServicingApi.prepayLoan(loan.loanId, {
                amount: parseFloat(amount),
                mode: 'ONLINE',
                transactionRef: `PREPAY-${Date.now()}`
            });

            toast({
                title: 'Prepayment Successful',
                description: 'Principal reduced and EMI recalculated.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Prepayment Failed',
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
                    <DialogTitle>Prepay Loan</DialogTitle>
                    <DialogDescription>
                        Reduce your principal amount. Your EMI will be reduced while tenure remains the same.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <Label className="text-muted-foreground">Outstanding Principal</Label>
                            <div className="font-semibold">₹{loan.outstandingPrincipal.toLocaleString()}</div>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Current EMI</Label>
                            <div className="font-semibold">₹{loan.monthlyEmi.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Prepayment Amount</Label>
                        <Input
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            type="number"
                            placeholder="Enter amount to prepay"
                        />
                    </div>

                    {loan.prepaymentPenaltyRate > 0 && amount && !isNaN(parseFloat(amount)) && (
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                            <div className="flex justify-between items-center">
                                <Label className="text-yellow-800">Prepayment Penalty ({loan.prepaymentPenaltyRate}%)</Label>
                                <span className="font-bold text-yellow-800">
                                    ₹{((parseFloat(amount) * loan.prepaymentPenaltyRate) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <p className="text-xs text-yellow-700 mt-1">
                                *This fee will be added to your outstanding balance.
                            </p>
                        </div>
                    )}

                    {estimatedEmi !== null && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                            <Label className="text-green-800">New Estimated EMI</Label>
                            <div className="text-2xl font-bold text-green-700">
                                ₹{estimatedEmi.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                                *Approximate calculation. Tenure remains same.
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handlePrepay} disabled={loading || !amount}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Prepayment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
