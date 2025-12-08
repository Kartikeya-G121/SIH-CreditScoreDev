'use client';

import { Building2, Users } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LoanType } from '@/types/loan-application-types';

interface LoanTypeSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectType: (type: LoanType) => void;
}

export function LoanTypeSelectionDialog({
    open,
    onOpenChange,
    onSelectType,
}: LoanTypeSelectionDialogProps) {
    const handleSelect = (type: LoanType) => {
        onSelectType(type);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Choose Loan Type</DialogTitle>
                    <DialogDescription>
                        Select whether you want to apply for an individual loan or a group loan
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 sm:grid-cols-2">
                    {/* Individual Loan Card */}
                    <Card
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
                        onClick={() => handleSelect('individual')}
                    >
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 group-hover:scale-110 transition-transform">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-xl">Individual Loan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Apply for a personal loan based on your individual credit score and financial profile
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Quick approval process</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Based on your credit score</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Flexible loan amounts</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Group Loan Card */}
                    <Card
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
                        onClick={() => handleSelect('group')}
                    >
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 group-hover:scale-110 transition-transform">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-xl">Group Loan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center">
                                Apply for a loan through your group with shared responsibility and better rates
                            </CardDescription>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Lower interest rates</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Shared group responsibility</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Higher loan amounts</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
