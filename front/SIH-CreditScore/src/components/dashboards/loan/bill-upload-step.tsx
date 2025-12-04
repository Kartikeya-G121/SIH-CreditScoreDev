'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Zap, Flame, Smartphone, Trash2, RefreshCw } from 'lucide-react';
import { consumptionService } from '@/services/consumption-service';
import { BillCategory, ConsumptionEntry } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BillUploadStepProps {
    onNext: () => void;
    onBack: () => void;
    applicationId?: number;
    referenceDate?: Date;
}

export function BillUploadStep({ onNext, onBack, applicationId, referenceDate }: BillUploadStepProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
    const [billsByCategory, setBillsByCategory] = useState<Map<BillCategory, ConsumptionEntry[]>>(new Map());
    const [uploadProgress, setUploadProgress] = useState(0);

    // Fetch existing bills on mount
    useEffect(() => {
        fetchBills();
    }, [referenceDate]);

    const fetchBills = async () => {
        try {
            setIsLoading(true);
            const data = await consumptionService.getRecentBillsByCategory(5, referenceDate);
            setBillsByCategory(data);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load existing bills.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploadingCategory(category);
        setUploadProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        try {
            const fileList = Array.from(files);
            await consumptionService.uploadBillBatch(fileList, category);

            setUploadProgress(100);
            toast({
                title: 'Upload Successful',
                description: `Successfully uploaded ${files.length} bill(s) for ${category}.`,
            });

            // Refresh list
            await fetchBills();
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Failed to upload bills. Please try again.',
            });
        } finally {
            clearInterval(interval);
            setUploadingCategory(null);
            setUploadProgress(0);
            // Reset input
            event.target.value = '';
        }
    };

    const getCategoryIcon = (category: BillCategory) => {
        switch (category) {
            case BillCategory.ELECTRICITY:
                return <Zap className="h-5 w-5 text-yellow-500" />;
            case BillCategory.GAS:
                return <Flame className="h-5 w-5 text-orange-500" />;
            case BillCategory.TELEPHONE:
                return <Smartphone className="h-5 w-5 text-blue-500" />;
            default:
                return <FileText className="h-5 w-5 text-slate-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const categories = [
        { id: BillCategory.ELECTRICITY, label: 'Electricity', description: 'Upload recent electricity bills' },
        { id: BillCategory.GAS, label: 'Gas / LPG', description: 'Upload gas connection bills' },
        { id: BillCategory.TELEPHONE, label: 'Mobile / Telephone', description: 'Upload mobile recharge or landline bills' },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Bill Upload & Verification</CardTitle>
                    <CardDescription>
                        Upload your utility bills to boost your credit score. We analyze your repayment history to approve your loan faster.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                            {categories.map((cat) => {
                                const bills = billsByCategory.get(cat.id) || [];
                                const isUploading = uploadingCategory === cat.id;

                                return (
                                    <Card key={cat.id} className="overflow-hidden border-slate-200 transition-all hover:shadow-md">
                                        <div className="bg-slate-50 p-4 border-b flex items-center gap-3">
                                            <div className="rounded-full bg-white p-2 shadow-sm">
                                                {getCategoryIcon(cat.id)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{cat.label}</h3>
                                                <p className="text-xs text-slate-500">{bills.length} bills uploaded</p>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Upload Area */}
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id={`upload-${cat.id}`}
                                                    className="hidden"
                                                    multiple
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => handleFileUpload(e, cat.id)}
                                                    disabled={isUploading}
                                                />
                                                <label
                                                    htmlFor={`upload-${cat.id}`}
                                                    className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isUploading
                                                        ? 'border-primary/50 bg-primary/5 cursor-wait'
                                                        : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50 cursor-pointer'
                                                        }`}
                                                >
                                                    {isUploading ? (
                                                        <div className="space-y-2 w-full">
                                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                                            <p className="text-sm font-medium text-primary">Uploading...</p>
                                                            <Progress value={uploadProgress} className="h-1 w-full" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                                            <p className="text-sm font-medium text-slate-900">Click to upload</p>
                                                            <p className="text-xs text-slate-500">PDF, JPG or PNG</p>
                                                        </>
                                                    )}
                                                </label>
                                            </div>

                                            {/* Recent Bills List */}
                                            {bills.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent Uploads</p>
                                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                        {bills.slice(0, 3).map((bill) => (
                                                            <div key={bill.entryId} className="flex items-center justify-between rounded-md border bg-white p-2 text-sm">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                                                    <div className="truncate">
                                                                        <p className="truncate font-medium text-slate-700">
                                                                            {bill.billingDate ? new Date(bill.billingDate).toLocaleDateString() : 'Processing...'}
                                                                        </p>
                                                                        {bill.billingAmount && (
                                                                            <p className="text-xs text-slate-500">₹{bill.billingAmount}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {getStatusBadge(bill.verificationStatus || 'PENDING')}
                                                            </div>
                                                        ))}
                                                        {bills.length > 3 && (
                                                            <p className="text-xs text-center text-slate-400">
                                                                + {bills.length - 3} more bills
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8 flex justify-between">
                        <Button variant="outline" onClick={onBack}>
                            Back
                        </Button>
                        <Button onClick={onNext} size="lg" className="gap-2">
                            Continue to Review
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
