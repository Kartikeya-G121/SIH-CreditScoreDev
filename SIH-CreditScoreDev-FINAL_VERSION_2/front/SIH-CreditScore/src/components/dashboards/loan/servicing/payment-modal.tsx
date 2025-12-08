import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
    loanId: number;
    amountDue: number;
    type: 'EMI' | 'OVERDUE';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function PaymentModal({ loanId, amountDue, type, open, onOpenChange, onSuccess }: PaymentModalProps) {
    const [amount, setAmount] = useState(amountDue.toString());
    const [mode, setMode] = useState<string>('ONLINE');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handlePayment = async () => {
        try {
            setLoading(true);
            const req = {
                amount: parseFloat(amount),
                mode: mode as any,
                transactionRef: `MOCK-${Date.now()}`
            };

            if (type === 'EMI') {
                await loanServicingApi.payEmi(loanId, req);
            } else {
                await loanServicingApi.payOverdue(loanId, req);
            }

            toast({
                title: 'Payment Successful',
                description: `₹${amount} paid successfully via ${mode}`,
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
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
                    <DialogTitle>Pay {type === 'EMI' ? 'Monthly EMI' : 'Overdue Amount'}</DialogTitle>
                    <DialogDescription>
                        Complete your payment via Mock Gateway.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount
                        </Label>
                        <Input
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            type="number"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mode" className="text-right">
                            Mode
                        </Label>
                        <Select value={mode} onValueChange={setMode}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Payment Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ONLINE">Online (UPI/Card)</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="DRAFT">Demand Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handlePayment} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Pay Now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
