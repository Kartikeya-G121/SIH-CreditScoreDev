'use client';

import { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LoanType } from '@/types/loan-application-types';

interface LoanConsentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loanType: LoanType;
    groupId?: number;
    groupName?: string;
    onConsent: () => void;
}

export function LoanConsentDialog({
    open,
    onOpenChange,
    loanType,
    groupId,
    groupName,
    onConsent,
}: LoanConsentDialogProps) {
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConsent = async () => {
        if (!agreedToTerms) return;

        setIsSubmitting(true);
        try {
            // Call the consent handler
            await onConsent();
            // Reset state
            setAgreedToTerms(false);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to submit consent:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setAgreedToTerms(false);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Loan Application Consent
                    </DialogTitle>
                    <DialogDescription>
                        Please read and agree to the terms and conditions before proceeding with your{' '}
                        {loanType === 'GROUP' ? 'group' : 'individual'} loan application
                        {groupName && ` for ${groupName}`}
                    </DialogDescription>
                </DialogHeader>

                <Alert className="my-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        By agreeing to these terms, you acknowledge that you have read and understood all the
                        conditions and obligations associated with this loan application.
                    </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-6 text-sm pr-4">
                        {/* Loan Terms Section */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                1. Loan Terms & Conditions
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • This loan application is subject to approval based on your credit score,
                                    financial profile, and eligibility criteria.
                                </p>
                                <p>
                                    • The loan amount, interest rate, and tenure will be determined based on the
                                    selected scheme and your profile assessment.
                                </p>
                                <p>
                                    • You must provide accurate and truthful information in your application. Any
                                    misrepresentation may result in rejection or legal action.
                                </p>
                                {loanType === 'GROUP' && (
                                    <p>
                                        • As a group loan applicant, you share joint responsibility with other group
                                        members for loan repayment.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Interest Rate Section */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                2. Interest Rate Information
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • Interest rates are determined by the selected loan scheme and your risk
                                    profile.
                                </p>
                                <p>
                                    • Rates may vary based on regional parameters, loan amount, and tenure selected.
                                </p>
                                <p>
                                    • The final interest rate will be communicated to you before loan disbursement.
                                </p>
                                {loanType === 'GROUP' && (
                                    <p>• Group loans typically receive preferential interest rates.</p>
                                )}
                            </div>
                        </section>

                        {/* Repayment Obligations */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                3. Repayment Obligations
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • You are obligated to repay the loan amount along with applicable interest as
                                    per the agreed schedule.
                                </p>
                                <p>
                                    • EMI payments must be made on or before the due date to avoid penalties and
                                    negative impact on your credit score.
                                </p>
                                <p>
                                    • Failure to make timely payments may result in additional charges, legal action,
                                    and impact on future loan eligibility.
                                </p>
                                {loanType === 'GROUP' && (
                                    <p>
                                        • In case of default by any group member, the entire group may be held
                                        responsible for repayment.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Default Consequences */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                4. Consequences of Default
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • Defaulting on loan payments will negatively impact your Composite Score and
                                    future loan eligibility.
                                </p>
                                <p>
                                    • Late payment fees and penalty interest may be charged on overdue amounts.
                                </p>
                                <p>
                                    • Persistent default may result in legal proceedings and asset recovery actions.
                                </p>
                                {loanType === 'GROUP' && (
                                    <p>
                                        • Group default may affect all members' credit scores and future group lending
                                        opportunities.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Data Usage Consent */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                5. Data Usage & Privacy
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • Your personal and financial information will be used for loan processing,
                                    credit assessment, and compliance purposes.
                                </p>
                                <p>
                                    • We may share your information with credit bureaus, regulatory authorities, and
                                    partner financial institutions as required.
                                </p>
                                <p>
                                    • Your data will be stored securely and handled in accordance with applicable
                                    data protection laws.
                                </p>
                                <p>
                                    • You have the right to access, correct, or request deletion of your personal
                                    data as per our privacy policy.
                                </p>
                            </div>
                        </section>

                        {/* Additional Terms */}
                        <section>
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                6. Additional Terms
                            </h3>
                            <div className="space-y-2 text-muted-foreground pl-6">
                                <p>
                                    • This consent is valid for the current loan application only. Separate consent
                                    is required for future applications.
                                </p>
                                <p>
                                    • You may withdraw your application at any time before loan disbursement without
                                    penalty.
                                </p>
                                <p>
                                    • The lender reserves the right to reject any application without providing
                                    specific reasons.
                                </p>
                                <p>
                                    • These terms are governed by the laws of India and subject to the jurisdiction
                                    of competent courts.
                                </p>
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="flex items-start space-x-3 py-4 border-t">
                    <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-relaxed cursor-pointer"
                    >
                        I have read and agree to all the terms and conditions stated above. I understand my
                        obligations and the consequences of defaulting on this loan.
                    </Label>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConsent} disabled={!agreedToTerms || isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Agree & Continue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
