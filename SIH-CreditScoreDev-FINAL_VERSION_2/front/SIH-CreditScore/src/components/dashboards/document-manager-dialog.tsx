'use client';

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { beneficiaryService } from '@/services/beneficiary-service';
import { Loader2, FileText, Upload, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { BeneficiaryProfile } from '@/types/beneficiary';
import { Badge } from '@/components/ui/badge';

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all gap-4">
            <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        {title}
                        {isUploaded && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-5">
                                Verified
                            </Badge>
                        )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    {!isUploaded && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1.5 font-medium">
                            <AlertCircle className="h-3 w-3" /> Required for verification
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                />

                {isUploaded && (
                    <Button variant="outline" size="sm" onClick={onDownload} disabled={isProcessing} className="h-9">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                )}

                <Button
                    variant={isUploaded ? "outline" : "default"}
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className={isUploaded ? "h-9 border-slate-200 hover:bg-slate-100" : "h-9 bg-slate-900 hover:bg-slate-800"}
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
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50/50 border-b border-slate-100">
                    <DialogTitle className="text-xl">Manage Documents</DialogTitle>
                    <DialogDescription>
                        Upload and manage your official verification documents.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <DocumentItem
                        title="Caste Certificate"
                        description="Official certificate for category verification"
                        isUploaded={!!profile?.casteCertificateUrl}
                        onUpload={handleUploadCaste}
                        onDownload={() => handleDownload('caste')}
                        isProcessing={uploadingType === 'caste' || downloadingType === 'caste'}
                    />

                    <DocumentItem
                        title="Identity Proof"
                        description="Aadhar Card, PAN Card, or Voter ID"
                        isUploaded={!!profile?.identityProofUrl}
                        onUpload={handleUploadIdentity}
                        onDownload={() => handleDownload('identity')}
                        isProcessing={uploadingType === 'identity' || downloadingType === 'identity'}
                    />

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Why are these documents needed?</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            These documents are required to verify your identity and eligibility for various government schemes and loan benefits.
                            Your documents are stored securely and encrypted.
                        </p>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
