'use client';

import { SchemeResponse } from '@/types/scheme-types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchemeDetailsDialogProps {
    scheme: SchemeResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAdmin?: boolean;
}

export function SchemeDetailsDialog({ scheme, open, onOpenChange, isAdmin }: SchemeDetailsDialogProps) {
    const { toast } = useToast();

    if (!scheme) return null;

    const handleApply = () => {
        toast({
            title: "Application Started",
            description: `You have started applying for ${scheme.schemeName}. This feature is coming soon!`,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl">{scheme.schemeName}</DialogTitle>
                        <Badge variant={scheme.isActive ? 'default' : 'secondary'}>
                            {scheme.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                    </div>
                    <DialogDescription className="text-base">
                        Provided by {scheme.providerName} • {scheme.loanCategory}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                            <p className="text-2xl font-bold text-primary">{scheme.baseInterestRate}%</p>
                            {scheme.isTieredInterest && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    *Tiered rates apply above ₹{scheme.tierThreshold?.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                            <p className="text-lg font-semibold">
                                ₹{scheme.minAmount.toLocaleString()} - ₹{scheme.maxAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium text-muted-foreground">Tenure</p>
                            <p className="text-lg font-semibold">
                                {scheme.minTenureMonths} - {scheme.maxTenureMonths} Months
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium text-muted-foreground">Processing Fee</p>
                            <p className="text-lg font-semibold">Nil</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="font-medium">Eligibility Criteria</h4>
                        <ul className="grid gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Indian Citizen aged 18-60 years</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Valid Identity and Address Proof</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Minimum credit score of 650 (for higher amounts)</span>
                            </li>
                        </ul>
                    </div>

                    {!scheme.isActive && (
                        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            This scheme is currently inactive and not accepting new applications.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    {!isAdmin && <Button onClick={handleApply} disabled={!scheme.isActive}>Apply Now</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
