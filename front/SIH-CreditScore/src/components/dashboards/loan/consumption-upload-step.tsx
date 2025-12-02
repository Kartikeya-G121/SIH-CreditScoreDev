'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, Upload, X, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { consumptionService } from '@/services/consumption-service';
import { loanApplicationService } from '@/services/loan-application-service';
import { BillCategory, ConsumptionEntry } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConsumptionUploadStepProps {
    applicationId: number;
    onBack: () => void;
    onNext: () => void;
    isGroupLoan?: boolean;
}

interface CategoryBillsState {
    category: BillCategory;
    existingBills: ConsumptionEntry[];
    uploadedFiles: File[];
}

// Upload limits per category as per requirements
const UPLOAD_LIMITS: Partial<Record<BillCategory, number>> = {
    [BillCategory.ELECTRICITY]: 2,
    [BillCategory.GAS]: 3,
    [BillCategory.TELEPHONE]: 2, // Mobile Recharge
    // Default for others will be 2
};

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export function ConsumptionUploadStep({ applicationId, onBack, onNext, isGroupLoan }: ConsumptionUploadStepProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryStates, setCategoryStates] = useState<CategoryBillsState[]>([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                setIsLoading(true);
                const billsByCategory = await consumptionService.getRecentBillsByCategory(5);

                // Initialize category states for required categories
                // We focus on Electricity, Gas, and Mobile (Telephone) as per requirements
                // But we'll include all to be safe, or filter? 
                // Requirement says: "For each category (Electricity, Gas, Mobile Recharge) show a horizontal card/row"
                // I will show these 3 primarily, plus others if they have data? 
                // Let's stick to the standard categories but prioritize the display order.

                const categoriesToShow = [
                    BillCategory.ELECTRICITY,
                    BillCategory.GAS,
                    BillCategory.TELEPHONE,
                ];

                const states: CategoryBillsState[] = categoriesToShow.map(category => {
                    const existingBills = billsByCategory.get(category) || [];
                    return {
                        category,
                        existingBills,
                        uploadedFiles: [],
                    };
                });

                setCategoryStates(states);
            } catch (error) {
                console.error('Failed to fetch bills:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load existing bills. Please try again.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBills();
    }, [toast]);

    const getUploadLimit = (category: BillCategory) => {
        return UPLOAD_LIMITS[category] || 2;
    };

    const handleFileSelect = (category: BillCategory, files: FileList | null) => {
        if (!files || files.length === 0) return;

        setCategoryStates(prev => prev.map(state => {
            if (state.category !== category) return state;

            const limit = getUploadLimit(category);
            const currentUploads = state.uploadedFiles.length;
            const remainingSlots = limit - currentUploads;

            if (remainingSlots <= 0) return state;

            const filesToAdd: File[] = [];

            Array.from(files).forEach(file => {
                if (filesToAdd.length >= remainingSlots) return;

                // Validation
                if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                    toast({
                        variant: 'destructive',
                        title: 'File too large',
                        description: `${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit.`,
                    });
                    return;
                }

                if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                    toast({
                        variant: 'destructive',
                        title: 'Invalid file type',
                        description: `${file.name} is not a supported format (PDF, JPG, PNG).`,
                    });
                    return;
                }

                filesToAdd.push(file);
            });

            if (filesToAdd.length < files.length && files.length > remainingSlots) {
                toast({
                    title: 'Upload limit reached',
                    description: `Only added ${filesToAdd.length} file(s). Maximum ${limit} uploads allowed for this category.`,
                });
            }

            return {
                ...state,
                uploadedFiles: [...state.uploadedFiles, ...filesToAdd],
            };
        }));
    };

    const handleRemoveFile = (category: BillCategory, fileIndex: number) => {
        setCategoryStates(prev => prev.map(state => {
            if (state.category !== category) return state;

            return {
                ...state,
                uploadedFiles: state.uploadedFiles.filter((_, idx) => idx !== fileIndex),
            };
        }));
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmDialog(false);
        setIsSubmitting(true);

        try {
            // 1. Upload all new files by category
            const uploadPromises = categoryStates
                .filter(state => state.uploadedFiles.length > 0)
                .map(state =>
                    consumptionService.uploadBillBatch(
                        state.uploadedFiles,
                        state.category,
                        applicationId
                    )
                );

            if (uploadPromises.length > 0) {
                await Promise.all(uploadPromises);
            }

            // 2. Proceed to next step (Review)
            onNext();
        } catch (error) {
            console.error('Failed to upload bills:', error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Failed to upload bills. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTotalProgress = (): { fetched: number, uploaded: number, total: number } => {
        // This is just for display, the requirements are a bit specific about per-category counts
        // But we can show a global progress too
        let fetched = 0;
        let uploaded = 0;
        let totalSlots = 0;

        categoryStates.forEach(state => {
            fetched += state.existingBills.length;
            uploaded += state.uploadedFiles.length;
            totalSlots += 5; // Assuming 5 is the "fetch" capacity per category
        });

        return { fetched, uploaded, total: totalSlots };
    };

    const getCategoryStatus = (state: CategoryBillsState) => {
        const limit = getUploadLimit(state.category);
        const fetchedCount = state.existingBills.length;
        const uploadCount = state.uploadedFiles.length;
        const remainingUploads = Math.max(0, limit - uploadCount);

        return { limit, fetchedCount, uploadCount, remainingUploads };
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

    const progress = getTotalProgress();

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Upload Utility Bills</CardTitle>
                    <CardDescription>
                        Please upload your utility bills. We have fetched available bills from the last 5 months.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {categoryStates.map((state) => {
                        const { limit, fetchedCount, uploadCount, remainingUploads } = getCategoryStatus(state);
                        const displayName = consumptionService.getCategoryDisplayName(state.category);
                        const isMaxUploadsReached = remainingUploads === 0;

                        // Only show if it's a primary category or has data? 
                        // Requirement: "For each category (Electricity, Gas, Mobile Recharge) show a horizontal card/row"
                        // We'll show all for now.

                        return (
                            <div key={state.category} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                {/* Header Section */}
                                <div className="md:w-48 flex-shrink-0 space-y-2">
                                    <div className="font-semibold flex items-center gap-2">
                                        {displayName}
                                        {fetchedCount + uploadCount > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Monthly bills
                                    </p>
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Fetched: {fetchedCount} / 5
                                        <br />
                                        Remaining uploads: {remainingUploads}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Fetched Bills Area */}
                                    {/* Fetched Bills Area */}
                                    {fetchedCount > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {state.existingBills.map((bill) => (
                                                <div key={bill.entryId} className="flex flex-col justify-center p-2 bg-secondary/50 rounded border text-xs w-28 h-24">
                                                    <div className="font-medium truncate">₹{bill.billingAmount}</div>
                                                    <div className="text-muted-foreground">{new Date(bill.billingDate).toLocaleDateString()}</div>
                                                    <Badge variant="outline" className="mt-1 w-fit text-[10px]">Fetched</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic py-2">
                                            No bills found from last 5 months
                                        </div>
                                    )}

                                    {/* Upload Area */}
                                    <div className="flex flex-wrap gap-2">
                                        {/* Uploaded Files */}
                                        {state.uploadedFiles.map((file, idx) => (
                                            <div key={idx} className="relative flex flex-col justify-center p-2 bg-blue-50 border border-blue-100 rounded text-xs w-28 h-24 group">
                                                <div className="font-medium truncate" title={file.name}>{file.name}</div>
                                                <div className="text-blue-600">{(file.size / 1024).toFixed(0)} KB</div>
                                                <Badge className="mt-1 w-fit text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">New</Badge>
                                                <button
                                                    onClick={() => handleRemoveFile(state.category, idx)}
                                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Placeholders */}
                                        {Array.from({ length: remainingUploads }).map((_, idx) => (
                                            <TooltipProvider key={`placeholder-${idx}`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Label
                                                            htmlFor={`file-${state.category}-${idx}`}
                                                            className="flex flex-col items-center justify-center w-28 h-24 rounded border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                                                        >
                                                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                                            <span className="text-[10px] text-muted-foreground font-medium">Upload</span>
                                                            <Input
                                                                id={`file-${state.category}-${idx}`}
                                                                type="file"
                                                                accept={ALLOWED_FILE_TYPES.join(',')}
                                                                multiple
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    handleFileSelect(state.category, e.target.files);
                                                                    e.target.value = ''; // Reset input to allow selecting same file again
                                                                }}
                                                            />
                                                        </Label>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Upload {displayName} bill (PDF, JPG, PNG)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}

                                        {/* Max Reached Indicator */}
                                        {isMaxUploadsReached && state.uploadedFiles.length > 0 && (
                                            <div className="flex items-center justify-center w-28 h-24 rounded border border-transparent">
                                                <span className="text-[10px] text-muted-foreground text-center">
                                                    Max uploads<br />reached
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Uploads</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Proceeding will upload all newly added bills. You can review your application in the next step.

                                                {categoryStates.some((s: CategoryBillsState) => s.uploadedFiles.length > 0) && (
                                                    <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                                                        <p className="font-medium mb-2">Files to be uploaded:</p>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {categoryStates.map((state: CategoryBillsState) => {
                                                                if (state.uploadedFiles.length === 0) return null;
                                                                return (
                                                                    <li key={state.category}>
                                                                        {consumptionService.getCategoryDisplayName(state.category)}: {state.uploadedFiles.length} file(s)
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleConfirmSubmit}>Confirm & Proceed</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={() => setShowConfirmDialog(true)} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Next: Review
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
