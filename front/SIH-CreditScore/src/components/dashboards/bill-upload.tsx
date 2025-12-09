'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Zap, Flame, Smartphone, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { BillManualInputDialog } from './loan/bill-manual-input-dialog';
import { consumptionService } from '@/services/consumption-service';
import { BillCategory, ConsumptionEntry } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function BillUpload({ onBillConfirmed }: { onBillConfirmed?: (bill: any) => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [billsByCategory, setBillsByCategory] = useState<Map<BillCategory, ConsumptionEntry[]>>(new Map());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<{ files: File[], category: string } | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [manualInputData, setManualInputData] = useState<{ amount: number, date: string }[]>([]);

  // Fetch existing bills on mount
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      // Show last 6 months
      const data = await consumptionService.getRecentBillsByCategory(6, new Date());
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

    const currentBills = billsByCategory.get(category as BillCategory) || [];
    if (currentBills.length + files.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Limit Exceeded',
        description: 'You can only upload a maximum of 5 bills per category.',
      });
      return;
    }

    // Store files and start manual input flow
    setPendingUploads({ files: Array.from(files), category });
    setCurrentFileIndex(0);
    setManualInputData([]);

    // Reset input
    event.target.value = '';
  };

  const handleManualInputSubmit = (amount: number, date: string) => {
    if (!pendingUploads) return;

    const newData = [...manualInputData, { amount, date }];
    setManualInputData(newData);

    const nextIndex = currentFileIndex + 1;

    if (nextIndex < pendingUploads.files.length) {
      // Move to next file
      setCurrentFileIndex(nextIndex);
    } else {
      // All files have data, proceed with upload
      performUpload(pendingUploads.files, pendingUploads.category, newData);
    }
  };

  const performUpload = async (files: File[], category: string, inputData: { amount: number, date: string }[]) => {
    setUploadingCategory(category);
    setUploadProgress(0);
    setPendingUploads(null);
    setCurrentFileIndex(0);
    setManualInputData([]);

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
      const amounts = inputData.map(d => d.amount);
      const dates = inputData.map(d => d.date);

      const newBills = await consumptionService.uploadBillBatch(files, category, amounts, dates);

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${files.length} bill(s) for ${category}.`,
      });

      // Refresh list
      await fetchBills();

      // Notify parent if needed (optional, for profile update)
      if (onBillConfirmed && newBills.length > 0) {
        onBillConfirmed(newBills[0]);
      }

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
    }
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Bill Upload & Management
          </CardTitle>
          <CardDescription>
            Upload your utility bills to maintain a healthy credit profile. Max 5 bills per category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const bills = billsByCategory.get(cat.id) || [];
                const isUploading = uploadingCategory === cat.id;
                const isExpanded = expandedCategory === cat.id;
                const isLimitReached = bills.length >= 5;

                return (
                  <div key={cat.id} className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
                    {/* Horizontal Bar */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-slate-50 p-3 shadow-sm border">
                          {getCategoryIcon(cat.id)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{cat.label}</h3>
                          <p className="text-sm text-slate-500">{cat.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* View Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(cat.id)}
                          className="gap-2"
                        >
                          {isExpanded ? 'Hide' : 'View'} ({bills.length})
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {/* Upload Button */}
                        <div className="relative">
                          <input
                            type="file"
                            id={`upload-${cat.id}`}
                            className="hidden"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, cat.id)}
                            disabled={isUploading || isLimitReached}
                          />
                          <Button
                            size="sm"
                            className={cn(
                              "gap-2",
                              isLimitReached ? "opacity-80" : ""
                            )}
                            disabled={isUploading || isLimitReached}
                            asChild={!isUploading && !isLimitReached}
                          >
                            {isUploading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <label htmlFor={`upload-${cat.id}`} className="cursor-pointer flex items-center">
                                <Upload className="h-4 w-4 mr-1" />
                                {isLimitReached ? 'Limit Reached' : 'Upload'}
                              </label>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar (Visible only when uploading this category) */}
                    {isUploading && (
                      <div className="px-4 pb-4">
                        <Progress value={uploadProgress} className="h-1 w-full" />
                        <p className="text-xs text-center text-muted-foreground mt-1">Uploading your documents...</p>
                      </div>
                    )}

                    {/* Collapsible Content (Bill List) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                        {bills.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {bills.map((bill) => (
                              <div key={bill.entryId} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div className="truncate">
                                    <p className="truncate font-medium text-sm text-slate-700">
                                      {bill.billingDate ? new Date(bill.billingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Processing...'}
                                    </p>
                                    {bill.billingAmount && (
                                      <p className="text-xs text-slate-500">₹{bill.billingAmount.toLocaleString()}</p>
                                    )}
                                  </div>
                                </div>
                                {getStatusBadge(bill.verificationStatus || 'PENDING')}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <Upload className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-900">No bills uploaded yet</p>
                            <p className="text-xs text-slate-500 mt-1">Upload your first {cat.label} bill to get started</p>
                          </div>
                        )}

                        {isLimitReached && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                            <AlertCircle className="h-4 w-4" />
                            <span>Maximum limit of 5 bills reached for this category. You cannot upload more.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input Dialog */}
      {pendingUploads && (
        <BillManualInputDialog
          open={!!pendingUploads}
          onOpenChange={(open) => {
            if (!open) {
              setPendingUploads(null);
              setCurrentFileIndex(0);
              setManualInputData([]);
            }
          }}
          fileName={pendingUploads.files[currentFileIndex]?.name || ''}
          categoryName={consumptionService.getCategoryDisplayName(pendingUploads.category as BillCategory)}
          onSubmit={handleManualInputSubmit}
        />
      )}
    </div>
  );
}
