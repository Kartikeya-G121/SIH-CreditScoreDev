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
import { Loader2, Upload } from 'lucide-react';
import type { CreateProfileRequest } from '@/types/beneficiary';
import { INDIAN_STATES } from '@/lib/constants/states';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    casteCategory: z.string().optional(),
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.string().optional(),
    addressLine: z.string().min(5, 'Address is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    regionType: z.enum(['RURAL', 'URBAN']),
    literacyScore: z.coerce.number().min(0).max(100).optional(),
    identityProofType: z.string().optional(),
    education: z.string().optional(),
    familySize: z.coerce.number().min(1).optional(),
    dependencyCount: z.coerce.number().min(0).optional(),
    landOwned: z.coerce.number().min(0).optional(),
    incomeSource: z.string().optional(),
    isGraduate: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CreateProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateProfileDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateProfileDialogProps) {
    const [loading, setLoading] = useState(false);
    const [casteCertificate, setCasteCertificate] = useState<File | undefined>();
    const [identityProof, setIdentityProof] = useState<File | undefined>();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            regionType: 'RURAL',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setLoading(true);
        try {
            const profileData: CreateProfileRequest = {
                ...data,
                dob: data.dob,
                literacyScore: data.literacyScore,
                familySize: data.familySize,
                dependencyCount: data.dependencyCount,
                landOwned: data.landOwned,
                isGraduate: data.isGraduate,
            };

            await beneficiaryService.createProfileWithFiles(
                profileData,
                casteCertificate,
                identityProof
            );

            toast({
                title: 'Success',
                description: 'Profile created successfully with documents',
            });
            onSuccess();
            onOpenChange(false);
            form.reset();
            setCasteCertificate(undefined);
            setIdentityProof(undefined);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create profile',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Beneficiary Profile</DialogTitle>
                    <DialogDescription>
                        Complete your profile to access loan services. Upload documents for faster verification.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Personal Information</h3>

                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter your full name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Birth *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
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
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
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
                                    name="identityProofType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Identity Proof Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="AADHAR">Aadhar Card</SelectItem>
                                                    <SelectItem value="PAN">PAN Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Address Information</h3>

                            <FormField
                                control={form.control}
                                name="addressLine"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Street address" />
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
                                            <FormLabel>District *</FormLabel>
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
                                            <FormLabel>State *</FormLabel>
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
                                            <FormLabel>Pincode *</FormLabel>
                                            <FormControl>
                                                <Input {...field} maxLength={6} />
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
                                            <FormLabel>Region Type *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
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
                            <h3 className="text-sm font-semibold">Socio-Economic Information (Optional)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="education"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Education Level</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g., Graduate" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="incomeSource"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Income Source</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g., Agriculture" />
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
                                                <Input type="number" {...field} min="1" />
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
                                                <Input type="number" {...field} min="0" />
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
                                            <FormLabel>Land (acres)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} min="0" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Document Uploads */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Document Uploads (Optional)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Caste Certificate</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setCasteCertificate(e.target.files?.[0])}
                                            className="cursor-pointer"
                                        />
                                        {casteCertificate && (
                                            <span className="text-xs text-green-600">✓</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Identity Proof</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setIdentityProof(e.target.files?.[0])}
                                            className="cursor-pointer"
                                        />
                                        {identityProof && (
                                            <span className="text-xs text-green-600">✓</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
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
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Create Profile
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
