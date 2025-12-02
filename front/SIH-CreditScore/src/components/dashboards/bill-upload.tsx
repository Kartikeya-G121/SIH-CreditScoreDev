'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Zap, Flame, Smartphone, CheckCircle2 } from 'lucide-react';
import { consumptionService } from '@/services/consumption-service';
import { BillCategory, ConsumptionEntry } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function BillUpload() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [billsByCategory, setBillsByCategory] = useState<Map<BillCategory, ConsumptionEntry[]>>(new Map());
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch existing bills on mount
  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      // For dashboard view, we might want to see all recent bills, not just 5 months relative to an app
      // But for consistency with credit scoring, let's show last 6 months from today
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Bill Upload & Management
          </CardTitle>
          <CardDescription>
            Upload your utility bills to maintain a healthy credit profile. Regular uploads help in faster loan approvals.
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
                  <Card key={cat.id} className="overflow-hidden border-slate-200 transition-all hover:shadow-md hover:border-primary/20">
                    <div className="bg-white p-4 border-b flex items-center gap-3">
                      <div className="rounded-full bg-slate-50 p-2 shadow-sm border">
                        {getCategoryIcon(cat.id)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{cat.label}</h3>
                        <p className="text-xs text-slate-500">{bills.length} bills in last 6 months</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-4 bg-slate-50/50 h-full">
                      {/* Upload Area */}
                      <div className="relative">
                        <input
                          type="file"
                          id={`dashboard-upload-${cat.id}`}
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, cat.id)}
                          disabled={isUploading}
                        />
                        <label
                          htmlFor={`dashboard-upload-${cat.id}`}
                          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${isUploading
                              ? 'border-primary/50 bg-primary/5 cursor-wait'
                              : 'border-slate-300 bg-white hover:border-primary hover:bg-blue-50/30 cursor-pointer shadow-sm'
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
                              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2 group-hover:text-primary" />
                              <p className="text-sm font-medium text-slate-900">Upload New Bills</p>
                              <p className="text-xs text-slate-500">PDF, JPG or PNG</p>
                            </>
                          )}
                        </label>
                      </div>

                      {/* Recent Bills List */}
                      {bills.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Recent History
                          </p>
                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                            {bills.map((bill) => (
                              <div key={bill.entryId} className="flex items-center justify-between rounded-md border bg-white p-2.5 text-sm shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="truncate">
                                    <p className="truncate font-medium text-slate-700">
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
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs italic">
                          No recent bills uploaded
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
