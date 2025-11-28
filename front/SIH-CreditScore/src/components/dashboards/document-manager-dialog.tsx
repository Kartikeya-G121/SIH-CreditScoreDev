'use client';

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { beneficiaryService } from '@/services/beneficiary-service';
import { Loader2, FileText, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { BeneficiaryProfile } from '@/types/beneficiary';

interface DocumentManagerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: BeneficiaryProfile | null;
    onRefresh: () => void;
}

interface DocumentItemProps {
    title: string;
    description: string;
    isUploaded: boolean;
    onUpload: (file: File) => Promise<void>;
    onDownload: () => Promise<void>;
    isProcessing: boolean;
}

function DocumentItem({ title, description, isUploaded, onUpload, onDownload, isProcessing }: DocumentItemProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onUpload(file);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-medium flex items-center gap-2">
                        {title}
                        {isUploaded && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    {!isUploaded && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> Missing
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                />

                {isUploaded && (
                    <Button variant="outline" size="sm" onClick={onDownload} disabled={isProcessing}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                )}

                <Button
                    variant={isUploaded ? "ghost" : "default"}
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploaded ? 'Replace' : 'Upload'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export function DocumentManagerDialog({ open, onOpenChange, profile, onRefresh }: DocumentManagerDialogProps) {
    const { toast } = useToast();
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [downloadingType, setDownloadingType] = useState<string | null>(null);

    const handleUploadCaste = async (file: File) => {
        try {
            setUploadingType('caste');
            await beneficiaryService.uploadCasteCertificate(file);
            toast({ title: 'Success', description: 'Caste certificate uploaded successfully.' });
            onRefresh();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload caste certificate.' });
        } finally {
            setUploadingType(null);
        }
    };

    const handleUploadIdentity = async (file: File) => {
        try {
            setUploadingType('identity');
            await beneficiaryService.uploadIdentityProof(file);
            toast({ title: 'Success', description: 'Identity proof uploaded successfully.' });
            onRefresh();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload identity proof.' });
        } finally {
            setUploadingType(null);
        }
    };

    const handleDownload = async (type: 'caste' | 'identity') => {
        try {
            setDownloadingType(type);
            let blob: Blob;
            let filename: string;

            if (type === 'caste') {
                blob = await beneficiaryService.downloadCertificate();
                filename = 'caste_certificate';
            } else {
                blob = await beneficiaryService.downloadIdentityProof();
                filename = 'identity_proof';
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Browser might detect extension from blob type
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download document.' });
        } finally {
            setDownloadingType(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Documents</DialogTitle>
                    <DialogDescription>
                        View, download, or update your official documents.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
