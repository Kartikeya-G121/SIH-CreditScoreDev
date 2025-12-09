'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, IndianRupee } from 'lucide-react';

interface BillManualInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileName: string;
    onSubmit: (amount: number, date: string) => void;
    categoryName: string;
}

export function BillManualInputDialog({
    open,
    onOpenChange,
    fileName,
    onSubmit,
    categoryName
}: BillManualInputDialogProps) {
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});

    const validate = () => {
        const newErrors: { amount?: string; date?: string } = {};

        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount greater than 0';
        }

        if (!date) {
            newErrors.date = 'Please select a billing date';
        } else if (new Date(date) > new Date()) {
            newErrors.date = 'Billing date cannot be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(parseFloat(amount), date);
            setAmount('');
            setDate('');
            setErrors({});
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Enter Bill Details</DialogTitle>
                    <DialogDescription>
                        Please provide the billing amount and date for your {categoryName} bill.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Name Display */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{fileName}</span>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Billing Amount *</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`pl-9 ${errors.amount ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {errors.amount && (
                            <p className="text-sm text-destructive">{errors.amount}</p>
                        )}
                    </div>

                    {/* Date Input */}
                    <div className="space-y-2">
                        <Label htmlFor="date">Billing Date *</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="date"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`pl-9 ${errors.date ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {errors.date && (
                            <p className="text-sm text-destructive">{errors.date}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Save Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
