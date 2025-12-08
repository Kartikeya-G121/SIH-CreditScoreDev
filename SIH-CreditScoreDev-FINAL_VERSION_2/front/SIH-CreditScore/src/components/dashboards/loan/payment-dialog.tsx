'use client';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { loanService } from '@/services/loan-service';
import type { Loan, PaymentRequest } from '@/types/loan-types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PaymentDialogProps {
    loan: Loan | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PaymentDialog({ loan, open, onOpenChange, onSuccess }: PaymentDialogProps) {
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentRequest['mode']>('UPI');
    const [transactionRef, setTransactionRef] = useState('');
    const [adjustmentMode, setAdjustmentMode] = useState<'TENURE_REDUCTION' | 'EMI_REDUCTION'>('TENURE_REDUCTION');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

    // Reset form when dialog opens with new loan
    useEffect(() => {
        if (open && loan) {
            setAmount(loan.monthlyEmi.toString());
            setPaymentMode('UPI');
            setTransactionRef('');
            setAdjustmentMode('TENURE_REDUCTION');
            setSuccess(false);
        }
    }, [open, loan]);

    if (!loan) return null;

    const paymentAmount = parseFloat(amount) || 0;

    // Calculate payment breakdown (simplified - actual calculation is on backend)
    const estimatedInterest = Math.min(paymentAmount, loan.monthlyEmi * 0.3); // Rough estimate
    const estimatedPrincipal = Math.max(0, paymentAmount - estimatedInterest);
    const newOutstanding = Math.max(0, loan.outstandingPrincipal - estimatedPrincipal);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentAmount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Please enter a valid payment amount',
            });
            return;
        }

        try {
            setLoading(true);

            const paymentData: PaymentRequest = {
                amount: paymentAmount,
                mode: paymentMode,
                transactionRef: transactionRef || undefined,
                adjustmentMode,
            };

            await loanService.makePayment(loan.loanId, paymentData);

            setSuccess(true);
            toast({
                title: 'Payment Successful!',
                description: `₹${paymentAmount.toLocaleString('en-IN')} paid successfully`,
            });

            // Wait a bit to show success state, then close and refresh
            setTimeout(() => {
                onOpenChange(false);
                onSuccess();
            }, 2000);

        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Payment failed. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in-50">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-green-900">Payment Successful!</h3>
                            <p className="text-muted-foreground mt-2">
                                Your payment of ₹{paymentAmount.toLocaleString('en-IN')} has been recorded
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <IndianRupee className="h-6 w-6" />
                        Make Payment
                    </DialogTitle>
                    <DialogDescription>
                        Loan #{loan.loanId} • {loan.isGroupLoan ? 'Group Loan' : 'Personal Loan'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Loan Summary */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-xs text-muted-foreground">Current EMI</p>
                            <p className="text-lg font-semibold flex items-center">
                                <IndianRupee className="h-4 w-4" />
                                {loan.monthlyEmi.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                            <p className="text-lg font-semibold flex items-center">
                                <IndianRupee className="h-4 w-4" />
                                {loan.outstandingPrincipal.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount *</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={loan.outstandingPrincipal + loan.monthlyEmi}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8 text-lg font-semibold"
                                placeholder="Enter amount"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount(loan.monthlyEmi.toString())}
                            >
                                EMI Amount
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount((loan.monthlyEmi * 2).toString())}
                            >
                                2x EMI
                            </Button>
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-3">
                        <Label>Payment Mode *</Label>
                        <RadioGroup value={paymentMode} onValueChange={(value) => setPaymentMode(value as any)}>
                            <div className="grid grid-cols-2 gap-3">
                                {(['UPI', 'BANK_TRANSFER', 'CASH', 'ONLINE'] as const).map((mode) => (
                                    <div key={mode} className="flex items-center space-x-2">
                                        <RadioGroupItem value={mode} id={mode} />
                                        <Label htmlFor={mode} className="font-normal cursor-pointer">
                                            {mode.replace('_', ' ')}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Transaction Reference */}
                    <div className="space-y-2">
                        <Label htmlFor="txnRef">Transaction Reference (Optional)</Label>
                        <Input
                            id="txnRef"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g., TXN123456789"
                        />
                    </div>

                    {/* Adjustment Mode (only show if paying more than EMI) */}
                    {paymentAmount > loan.monthlyEmi && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Label className="text-blue-900">Extra Payment Adjustment</Label>
                            <RadioGroup value={adjustmentMode} onValueChange={(value) => setAdjustmentMode(value as any)}>
                                <div className="space-y-2">
                                    <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="TENURE_REDUCTION" id="tenure" className="mt-1" />
                                        <div>
                                            <Label htmlFor="tenure" className="font-normal cursor-pointer text-blue-900">
                                                Reduce Tenure (Recommended)
                                            </Label>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Keep EMI same, finish loan faster
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <RadioGroupItem value="EMI_REDUCTION" id="emi" className="mt-1" />
                                        <div>
                                            <Label htmlFor="emi" className="font-normal cursor-pointer text-blue-900">
                                                Reduce EMI
                                            </Label>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Lower monthly payments, same duration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    <Separator />

                    {/* Payment Breakdown */}
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-semibold text-sm">Payment Breakdown (Estimated)</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Interest Component:</span>
                                <span className="font-medium">₹{estimatedInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Principal Component:</span>
                                <span className="font-medium">₹{estimatedPrincipal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold">
                                <span>New Outstanding:</span>
                                <span className="text-green-600">₹{newOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || paymentAmount <= 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
