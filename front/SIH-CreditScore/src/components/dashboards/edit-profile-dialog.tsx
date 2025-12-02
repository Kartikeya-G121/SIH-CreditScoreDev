'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { beneficiaryService } from '@/services/beneficiary-service';
import { useToast } from '@/hooks/use-toast';
import type { UpdateProfileRequest } from '@/types/beneficiary';
import { Upload, Download, Loader2, FileCheck } from 'lucide-react';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    casteCategory: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    addressLine: z.string().min(5, 'Address is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits'),
    regionType: z.enum(['RURAL', 'URBAN']),
    // Socio-economic fields
    education: z.string().optional(),
    familySize: z.number().min(1).optional(),
    dependencyCount: z.number().min(0).optional(),
    landOwned: z.number().min(0).optional(),
    incomeSource: z.string().optional(),
    isGraduate: z.boolean().optional(),
    literacyScore: z.number().min(0).max(100).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: any;
    onSuccess: () => void;
}

export function EditProfileDialog({
    open,
    onOpenChange,
    initialData,
    onSuccess,
}: EditProfileDialogProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingCert, setUploadingCert] = useState(false);
    const [uploadingId, setUploadingId] = useState(false);
    const [downloadingCert, setDownloadingCert] = useState(false);
    const [downloadingId, setDownloadingId] = useState(false);
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: initialData?.fullName || '',
            casteCategory: initialData?.casteCategory || '',
            dob: initialData?.dob || '',
            gender: initialData?.gender || '',
            addressLine: initialData?.addressLine || '',
            district: initialData?.district || '',
            state: initialData?.state || '',
            pincode: initialData?.pincode || '',
            regionType: initialData?.regionType || 'RURAL',
            education: initialData?.education || '',
            familySize: initialData?.familySize ? Number(initialData.familySize) : undefined,
            dependencyCount: initialData?.dependencyCount ? Number(initialData.dependencyCount) : undefined,
            landOwned: initialData?.landOwned ? Number(initialData.landOwned) : undefined,
            incomeSource: initialData?.incomeSource || '',
            isGraduate: initialData?.isGraduate || false,
            literacyScore: initialData?.literacyScore ? Number(initialData.literacyScore) : undefined,
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            const updateData: UpdateProfileRequest = {
                fullName: data.fullName,
                casteCategory: data.casteCategory,
                dob: data.dob,
                gender: data.gender,
                addressLine: data.addressLine,
                district: data.district,
                state: data.state,
                pincode: data.pincode,
                regionType: data.regionType,
                education: data.education,
                familySize: data.familySize,
                dependencyCount: data.dependencyCount,
                landOwned: data.landOwned,
                incomeSource: data.incomeSource,
                isGraduate: data.education === 'Graduate' || data.education === 'Post Graduate', // Auto-derive
                literacyScore: data.literacyScore,
            };

            await beneficiaryService.updateProfile(updateData);

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to update profile',
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCert(true);
        try {
            await beneficiaryService.uploadCasteCertificate(file);
            toast({
                title: "Success",
                description: "Caste certificate uploaded successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to upload certificate',
                variant: "destructive",
            });
        } finally {
            setUploadingCert(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleUploadIdentity = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(true);
        try {
            await beneficiaryService.uploadIdentityProof(file);
            toast({
                title: "Success",
                description: "Identity proof uploaded successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to upload identity proof',
                variant: "destructive",
            });
        } finally {
            setUploadingId(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDownloadCertificate = async () => {
        setDownloadingCert(true);
        try {
            const blob = await beneficiaryService.downloadCertificate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'caste_certificate.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: "Success",
                description: "Certificate downloaded successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to download certificate',
                variant: "destructive",
            });
        } finally {
            setDownloadingCert(false);
        }
    };

    const handleDownloadIdentity = async () => {
        setDownloadingId(true);
        try {
            const blob = await beneficiaryService.downloadIdentityProof();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'identity_proof.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: "Success",
                description: "Identity proof downloaded successfully",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to download identity proof',
                variant: "destructive",
            });
        } finally {
            setDownloadingId(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information and manage your documents.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Personal Information</h3>

                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="casteCategory"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Caste Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="GEN">General</SelectItem>
                                                    <SelectItem value="OBC">OBC</SelectItem>
                                                    <SelectItem value="SC">SC</SelectItem>
                                                    <SelectItem value="ST">ST</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="dob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Address Information</h3>

                            <FormField
                                control={form.control}
                                name="addressLine"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="district"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>District</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pincode</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="regionType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Region Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select region" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="RURAL">Rural</SelectItem>
                                                    <SelectItem value="URBAN">Urban</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Socio-Economic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Socio-Economic Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="education"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Education Level</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select education" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Illiterate">Illiterate</SelectItem>
                                                    <SelectItem value="Primary">Primary School</SelectItem>
                                                    <SelectItem value="Secondary">Secondary School</SelectItem>
                                                    <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                                    <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="incomeSource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Primary Income Source</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Farming, Labor, Business" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="familySize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Family Size</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dependencyCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dependents</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="landOwned"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Land (Acres)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Document Management */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Document Management</h3>

                            {/* Caste Certificate */}
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Caste Certificate</p>
                                        <p className="text-xs text-muted-foreground">Upload or download your caste certificate</p>
                                    </div>
                                    <FileCheck className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleUploadCertificate}
                                            disabled={uploadingCert}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadCertificate}
                                        disabled={downloadingCert}
                                    >
                                        {downloadingCert ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {uploadingCert && (
                                    <p className="text-xs text-blue-600 flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Uploading...
                                    </p>
                                )}
                            </div>

                            {/* Identity Proof */}
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Identity Proof</p>
                                        <p className="text-xs text-muted-foreground">Upload or download your identity proof</p>
                                    </div>
                                    <FileCheck className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleUploadIdentity}
                                            disabled={uploadingId}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadIdentity}
                                        disabled={downloadingId}
                                    >
                                        {downloadingId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {uploadingId && (
                                    <p className="text-xs text-blue-600 flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Uploading...
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
