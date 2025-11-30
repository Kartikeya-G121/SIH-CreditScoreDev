'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, FileText, Eye, MapPin, User, Home, ShieldCheck } from 'lucide-react';
import { beneficiaryService } from '@/services/beneficiary-service';
import type { BeneficiaryProfile } from '@/types/beneficiary';
import type { BeneficiaryDetailsData } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { EditProfileDialog } from '../edit-profile-dialog';

interface BeneficiaryDetailsStepProps {
    onNext: (data: BeneficiaryDetailsData) => void;
    onBack: () => void;
}

export function BeneficiaryDetailsStep({ onNext, onBack }: BeneficiaryDetailsStepProps) {
    const { toast } = useToast();
    const [profile, setProfile] = useState<BeneficiaryProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const data = await beneficiaryService.getMyProfile();
                setProfile(data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load your profile. Please try again.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [toast]);

    const handleNext = () => {
        if (!profile) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Profile data is not available.',
            });
            return;
        }

        const beneficiaryData: BeneficiaryDetailsData = {
            fullName: profile.fullName,
            addressLine: profile.addressLine,
            district: profile.district,
            state: profile.state,
            pincode: profile.pincode,
            regionType: profile.regionType,
            casteCategory: profile.casteCategory,
            casteCertificateUrl: profile.casteCertificateUrl,
            identityProofUrl: profile.identityProofUrl,
        };

        onNext(beneficiaryData);
    };

    const handleDownload = async (type: 'caste' | 'identity') => {
        try {
            let blob: Blob;
            let filename: string;

            if (type === 'caste') {
                blob = await beneficiaryService.downloadCertificate();
                filename = 'caste_certificate';
            } else {
                blob = await beneficiaryService.downloadIdentityProof();
                filename = 'identity_proof';
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download document.' });
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

    if (!profile) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="py-12">
                    <div className="text-center">
                        <p className="text-muted-foreground">Failed to load profile data.</p>
                        <Button onClick={onBack} variant="outline" className="mt-4">
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Review Your Details</CardTitle>
                <CardDescription>
                    Please review your beneficiary information. This data will be used for your loan application.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <User className="h-5 w-5 text-primary" />
                        <h3>Personal Information</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">Full Name</p>
                            <p className="font-medium">{profile.fullName}</p>
                        </div>
                        {profile.casteCategory && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">Caste Category</p>
                                <p className="font-medium">{profile.casteCategory}</p>
                            </div>
                        )}
                        {profile.dob && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">Date of Birth</p>
                                <p className="font-medium">{new Date(profile.dob).toLocaleDateString()}</p>
                            </div>
                        )}
                        {profile.gender && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">Gender</p>
                                <p className="font-medium">{profile.gender}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3>Address Information</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border bg-muted/50 p-4 md:col-span-2">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-medium">{profile.addressLine}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">District</p>
                            <p className="font-medium">{profile.district}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">State</p>
                            <p className="font-medium">{profile.state}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">Pincode</p>
                            <p className="font-medium">{profile.pincode}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">Region Type</p>
                            <p className="font-medium">{profile.regionType}</p>
                        </div>
                    </div>
                </div>

                {/* Socio-Economic Information */}
                {(profile.education || profile.familySize || profile.incomeSource) && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Home className="h-5 w-5 text-primary" />
                            <h3>Socio-Economic Information</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {profile.education && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Education</p>
                                    <p className="font-medium">{profile.education}</p>
                                </div>
                            )}
                            {profile.familySize && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Family Size</p>
                                    <p className="font-medium">{profile.familySize} members</p>
                                </div>
                            )}
                            {profile.incomeSource && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Income Source</p>
                                    <p className="font-medium">{profile.incomeSource}</p>
                                </div>
                            )}
                            {profile.landOwned !== undefined && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Land Owned</p>
                                    <p className="font-medium">{profile.landOwned} acres</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Documents */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3>Uploaded Documents</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {profile.casteCertificateUrl ? (
                            <div className="flex items-center justify-between rounded-lg border bg-green-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-900">Caste Certificate</p>
                                        <p className="text-xs text-green-700">Uploaded</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDownload('caste')}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">Caste Certificate - Not uploaded</p>
                            </div>
                        )}

                        {profile.identityProofUrl ? (
                            <div className="flex items-center justify-between rounded-lg border bg-green-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-900">Identity Proof</p>
                                        <p className="text-xs text-green-700">Uploaded</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDownload('identity')}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">Identity Proof - Not uploaded</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Status */}
                {profile.isProfileVerified && (
                    <div className="rounded-lg border bg-green-50 p-4 flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900">Profile Verified</p>
                            <p className="text-sm text-green-700">Your profile has been verified by an officer</p>
                        </div>
                    </div>
                )}

                {/* Edit Profile Link */}
                <div className="flex items-center justify-center py-4">
                    <Button variant="link" onClick={() => setShowEditDialog(true)}>
                        Need to update your information? Edit Profile
                    </Button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                    <Button onClick={onBack} variant="outline" size="lg">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={handleNext} size="lg">
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                {/* Edit Profile Dialog */}
                <EditProfileDialog
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                    initialData={profile}
                    onSuccess={async () => {
                        const updatedProfile = await beneficiaryService.getMyProfile();
                        setProfile(updatedProfile);
                        toast({
                            title: 'Profile Updated',
                            description: 'Your profile has been updated successfully.',
                        });
                    }}
                />
            </CardContent>
        </Card>
    );
}
