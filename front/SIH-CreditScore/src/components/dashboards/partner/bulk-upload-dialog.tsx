'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { partnerService, BulkUploadResult } from '@/services/partner-service';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<BulkUploadResult | null>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(f =>
                f.name.endsWith('.csv')
            );
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No files selected',
                description: 'Please select at least one CSV file',
            });
            return;
        }

        setIsUploading(true);
        try {
            const uploadResult = await partnerService.bulkUploadBeneficiaries(files);
            setResult(uploadResult);

            toast({
                title: 'Upload complete',
                description: `Processed ${uploadResult.totalRows} rows successfully`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message || 'An error occurred during upload',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFiles([]);
        setResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Bulk Upload Beneficiaries (CSV)
                    </DialogTitle>
                    <DialogDescription>
                        Upload one or more CSV files to create/update beneficiary accounts.
                        Required columns: email, phone. Optional: name, gender, dob, address, etc.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4">
                        {/* File Upload Area */}
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".csv"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Click to upload CSV files</p>
                                    <p className="text-sm text-muted-foreground">
                                        or drag and drop
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Selected Files */}
                        {files.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
                                    <div className="space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-muted rounded"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="text-sm">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({(file.size / 1024).toFixed(2)} KB)
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                    disabled={isUploading}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upload Button */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || files.length === 0}
                            >
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'Uploading...' : 'Upload & Process'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Results Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold">{result.totalRows}</div>
                                    <p className="text-sm text-muted-foreground">Total Rows</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {result.usersCreated}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Users Created</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {result.profilesUpdated}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Profiles Updated</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-2xl font-bold text-red-600">
                                        {result.failedRows}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Failed</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Success Message */}
                        {result.failedRows === 0 ? (
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    All rows processed successfully! New beneficiaries have been sent
                                    login credentials via email.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {result.failedRows} rows failed to process. See errors below.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Errors */}
                        {result.errors && result.errors.length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h4 className="font-medium mb-2 text-red-600">Errors</h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((error, index) => (
                                            <p key={index} className="text-sm text-muted-foreground">
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Button onClick={handleClose} className="w-full">
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
