'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle2, FileText, User, MapPin, IndianRupee, Calendar } from 'lucide-react';
import { loanApplicationService } from '@/services/loan-application-service';
import { beneficiaryService } from '@/services/beneficiary-service';
import { schemeService } from '@/services/scheme-service';
import type { ApplicationResponse } from '@/types/loan-application-types';
import type { SchemeResponse } from '@/types/scheme-types';
import type { BeneficiaryProfile } from '@/types/beneficiary';
import { useToast } from '@/hooks/use-toast';

interface ReviewApplicationStepProps {
    applicationId: number;
    onBack: () => void;
    onSubmit: () => void;
    isReadOnly?: boolean;
}

export function ReviewApplicationStep({ applicationId, onBack, onSubmit, isReadOnly = false }: ReviewApplicationStepProps) {
    const { toast } = useToast();
    const [application, setApplication] = useState<ApplicationResponse | null>(null);
    const [scheme, setScheme] = useState<SchemeResponse | null>(null);
    const [profile, setProfile] = useState<BeneficiaryProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [appData, profileData] = await Promise.all([
                    loanApplicationService.getApplicationById(applicationId),
                    beneficiaryService.getMyProfile()
                ]);
                setApplication(appData);
                setProfile(profileData);

                if (appData.schemeId) {
                    const schemeData = await schemeService.getSchemeById(appData.schemeId);
                    setScheme(schemeData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load application details. Please try again.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [applicationId, toast]);

    const handleSubmit = async () => {
        if (!consentGiven) {
            toast({
                variant: 'destructive',
                title: 'Consent Required',
                description: 'Please agree to the terms and conditions to proceed.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await loanApplicationService.submitApplication(applicationId);
            onSubmit();
        } catch (error) {
            console.error('Failed to submit application:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error instanceof Error ? error.message : 'Failed to submit application. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!application || !profile) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Failed to load review data.</p>
                    <Button onClick={onBack} variant="outline" className="mt-4">Go Back</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">{isReadOnly ? 'Application Details' : 'Review & Submit'}</CardTitle>
                <CardDescription>
                    {isReadOnly
                        ? `View details for application #${application.applicationId}`
                        : 'Please review all details carefully before submitting your loan application.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Loan Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        <h3>Loan Details</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Requested Amount</p>
                            <p className="text-lg font-bold text-primary">₹{application.requestedAmount.toLocaleString()}</p>
                        </div>
                        {scheme && (
                            <>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-sm text-muted-foreground">Scheme Name</p>
                                    <p className="font-medium">{scheme.schemeName}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-sm text-muted-foreground">Category</p>
                                    <p className="font-medium">{scheme.loanCategory}</p>
                                </div>
                            </>
                        )}
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">Tenure</p>
                            <p className="font-medium">{application.tenureMonths} Months</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4 md:col-span-2">
                            <p className="text-sm text-muted-foreground">Purpose</p>
                            <p className="font-medium">{application.purpose}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4 md:col-span-2">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium font-bold">{application.status}</p>
                        </div>
                    </div>
                </div>

                {/* Beneficiary Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3>Beneficiary Information</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-3">
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-medium">{profile.fullName}</p>
                        </div>
                        <div className="p-3">
                            <p className="text-sm text-muted-foreground">Caste Category</p>
                            <p className="font-medium">{profile.casteCategory || 'N/A'}</p>
                        </div>
                        <div className="p-3 md:col-span-2">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{profile.addressLine}, {profile.district}, {profile.state} - {profile.pincode}</p>
                        </div>
                    </div>
                </div>

                {/* Consent Section - Only show if NOT read-only */}
                {!isReadOnly && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 space-y-4">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="consent"
                                checked={consentGiven}
                                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                                className="mt-1"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="consent"
                                    className="text-sm font-medium leading-relaxed text-blue-900"
                                >
                                    I hereby declare that the information provided above is true and correct to the best of my knowledge.
                                    I authorize the verification of my details and documents. I understand that any false information
                                    may lead to rejection of my application.
                                </Label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    {!isReadOnly && (
                        <Button
                            onClick={handleSubmit}
                            disabled={!consentGiven || isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
