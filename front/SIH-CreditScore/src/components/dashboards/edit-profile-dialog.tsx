'use client';

import { useState, useEffect } from 'react';
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
import { Upload, Download, Loader2, FileCheck, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { INDIAN_STATES } from '@/lib/constants/states';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    casteCategory: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits').optional(),
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

    // Local state to track document status (synced with initialData initially, updated on upload)
    const [hasCasteCert, setHasCasteCert] = useState(false);
    const [hasIdentityProof, setHasIdentityProof] = useState(false);

    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: '',
            casteCategory: '',
            dob: '',
            gender: '',
            aadharNumber: '',
            addressLine: '',
            district: '',
            state: '',
            pincode: '',
            regionType: 'RURAL',
            education: '',
            familySize: undefined,
            dependencyCount: undefined,
            landOwned: undefined,
            incomeSource: '',
            isGraduate: false,
            literacyScore: undefined,
        },
    });

    // Update form and local state when initialData changes or dialog opens
    useEffect(() => {
        if (open && initialData) {
            form.reset({
                fullName: initialData.fullName || '',
                casteCategory: initialData.casteCategory || '',
                dob: initialData.dob || '',
                gender: initialData.gender || '',
                aadharNumber: initialData.aadharNumber || '',
                addressLine: initialData.addressLine || '',
                district: initialData.district || '',
                state: initialData.state || '',
                pincode: initialData.pincode || '',
                regionType: initialData.regionType || 'RURAL',
                education: initialData.education || '',
                familySize: initialData.familySize ? Number(initialData.familySize) : undefined,
                dependencyCount: initialData.dependencyCount ? Number(initialData.dependencyCount) : undefined,
                landOwned: initialData.landOwned ? Number(initialData.landOwned) : undefined,
                incomeSource: initialData.incomeSource || '',
                isGraduate: initialData.isGraduate || false,
                literacyScore: initialData.literacyScore ? Number(initialData.literacyScore) : undefined,
            });

            setHasCasteCert(!!initialData.casteCertificateUrl);
            setHasIdentityProof(!!initialData.identityProofUrl);
        }
    }, [initialData, open, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            const updateData: UpdateProfileRequest = {
                fullName: data.fullName,
                casteCategory: data.casteCategory,
                dob: data.dob,
                gender: data.gender,
                aadharNumber: data.aadharNumber,
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
            setHasCasteCert(true); // Update local state immediately
            toast({
                title: "Success",
                description: "Caste certificate uploaded successfully",
            });
            // Optionally trigger refresh in parent if needed, but local state update is enough for UI
            onSuccess();
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
            setHasIdentityProof(true); // Update local state immediately
            toast({
                title: "Success",
                description: "Identity proof uploaded successfully",
            });
            onSuccess();
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
            a.download = 'caste_certificate'; // Browser might detect extension
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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
            a.download = 'identity_proof'; // Browser might detect extension
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
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

    const DocumentField = ({
        label,
        description,
        isUploaded,
        isUploading,
        isDownloading,
        onUpload,
        onDownload
    }: any) => (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-900">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                {isUploaded ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Uploaded
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                        Pending
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-3">
                {isUploaded ? (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                            onClick={onDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Download
                        </Button>
                        <div className="relative">
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={onUpload}
                                disabled={isUploading}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-slate-50 text-orange-600 border-orange-200 hover:border-orange-300"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="relative w-full">
                        <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={onUpload}
                            disabled={isUploading}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Document
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                Personal Information
                            </h3>

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

                            <FormField
                                control={form.control}
                                name="aadharNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aadhar Card Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter 12-digit Aadhar number"
                                                maxLength={12}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                                <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                Address Information
                            </h3>

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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-[200px]">
                                                    {INDIAN_STATES.map((state) => (
                                                        <SelectItem key={state} value={state}>
                                                            {state}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                Socio-Economic Details
                            </h3>

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
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                Document Management
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <DocumentField
                                    label="Caste Certificate"
                                    description="Required for category verification"
                                    isUploaded={hasCasteCert}
                                    isUploading={uploadingCert}
                                    isDownloading={downloadingCert}
                                    onUpload={handleUploadCertificate}
                                    onDownload={handleDownloadCertificate}
                                />

                                <DocumentField
                                    label="Identity Proof"
                                    description="Aadhar, PAN, or Voter ID"
                                    isUploaded={hasIdentityProof}
                                    isUploading={uploadingId}
                                    isDownloading={downloadingId}
                                    onUpload={handleUploadIdentity}
                                    onDownload={handleDownloadIdentity}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
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
