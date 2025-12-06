// src/components/dashboard/BeneficiaryDashboard.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  IndianRupee,
  ThumbsUp,
  UploadCloud,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Lightbulb,
  BarChart3,
  Eye,
  FileText,
  Landmark,
} from 'lucide-react';

import { MOCK_BENEFICIARY_DATA, type User } from '@/lib/data';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useRouter } from 'next/navigation';
import BillUpload from './bill-upload';
import { type BillParserOutput } from '@/ai/flows/bill-parser';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { EditProfileDialog } from './edit-profile-dialog';
import { DocumentManagerDialog } from './document-manager-dialog';
import { GroupSelectionDialog } from './loan/group-selection-dialog';
import { LoanConsentDialog } from './loan/loan-consent-dialog';
import { loanApplicationService } from '@/services/loan-application-service';
import type { LoanType, ConsentData } from '@/types/loan-application-types';
import { MyApplicationsList } from './loan/my-applications-list';
import { LoanList } from './loan/loan-list';
import { PaymentDialog } from './loan/payment-dialog';
import type { Loan } from '@/types/loan-types';
import { BeautifulProfile } from './beautiful-profile';

type Props = {
  activeTab?: string;
};

const chartConfig: ChartConfig = {
  essential: { label: 'Essential', color: 'hsl(var(--chart-1))' },
  discretionary: { label: 'Discretionary', color: 'hsl(var(--chart-2))' },
};

const repaymentChartConfig: ChartConfig = {
  paid: { label: 'Paid', color: 'hsl(var(--chart-2))' },
  due: { label: 'Due', color: 'hsl(var(--chart-1))' },
};

function safeT(t: any, key: string, fallback = '') {
  try {
    const res = t(key);
    return typeof res === 'string' && res.length > 0 ? res : fallback;
  } catch {
    return fallback;
  }
}

/* ---------- Small subcomponents (keeps main render tidy) ---------- */

const ProfileBlock: React.FC<{ user?: User; t: any }> = ({ user, t }) => {
  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-16 w-16">
        {user?.avatar ? <AvatarImage src={user.avatar} alt={`${user?.name ?? 'User'} avatar`} /> : <AvatarFallback>{(user?.name?.charAt(0) ?? '?')}</AvatarFallback>}
      </Avatar>
      <div>
        <h3 className="text-lg font-semibold">{user?.name ?? safeT(t, 'welcome_message', 'Welcome')}</h3>
        <p className="text-sm text-muted-foreground">{user?.email ?? ''}</p>
      </div>
    </div>
  );
};

const ScorePie: React.FC<{ value: number; score: number; t: any }> = React.memo(({ value, score, t }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="relative h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: clamped }, { value: 100 - clamped }]}
            dataKey="value"
            innerRadius={60}
            outerRadius={78}
            startAngle={90}
            endAngle={450}
            cornerRadius={8}
          >
            <Cell fill="rgba(255,255,255,0.98)" />
            <Cell fill="rgba(255,255,255,0.15)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold mb-1">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/90 font-medium">{safeT(t, 'credit_score', 'Credit Score')}</span>
      </div>
    </div>
  );
});
ScorePie.displayName = 'ScorePie';

/* --------------------- Main Component --------------------- */

export default function BeneficiaryDashboard({ activeTab = 'overview' }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [savedBills, setSavedBills] = useState<BillParserOutput[]>([]);
  const [rescoreStatus, setRescoreStatus] = useState<'idle' | 'pending' | 'completed'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);

  // Loan application flow state
  const [showGroupSelectionDialog, setShowGroupSelectionDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>('individual');
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [selectedGroupName, setSelectedGroupName] = useState<string | undefined>();

  // Loan repayment state
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // New state for profile data
  const [consumptionEntries, setConsumptionEntries] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  const fetchProfile = async () => {
    try {
      // Dynamically import to avoid circular deps if any
      const { beneficiaryService } = await import('@/services/beneficiary-service');
      const { consumptionService } = await import('@/services/consumption-service');
      const { loanApplicationService } = await import('@/services/loan-application-service');

      const [profile, entries, apps] = await Promise.all([
        beneficiaryService.getMyProfile(),
        consumptionService.getMyEntries(),
        loanApplicationService.getMyApplications()
      ]);

      setProfileData(profile);
      setConsumptionEntries(entries);
      setApplications(apps);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  const handleDownload = async (type: 'caste' | 'identity') => {
    try {
      const { beneficiaryService } = await import('@/services/beneficiary-service');
      let blob: Blob;
      let filename: string;

      if (type === 'caste') {
        blob = await beneficiaryService.downloadCertificate();
        filename = 'caste_certificate';
      } else {
        blob = await beneficiaryService.downloadIdentityProof();
        filename = 'identity_proof';
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to download document.' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Auto-prompt for profile completion
  useEffect(() => {
    if (profileData && !profileData.addressLine && !showEditDialog) {
      // Check if we haven't prompted yet in this session
      const hasPrompted = sessionStorage.getItem('profile-prompted');
      if (!hasPrompted) {
        setShowEditDialog(true);
        sessionStorage.setItem('profile-prompted', 'true');
        toast({
          title: safeT(t, 'complete_profile', 'Complete Your Profile'),
          description: safeT(t, 'complete_profile_desc', 'Please provide your address and details to access all features.'),
        });
      }
    }
  }, [profileData, showEditDialog, t, toast]);

  // Data from mock — keep these local so component is testable without backend.
  const {
    creditScore = 0,
    riskLevel = 'Unknown',
    insights = [],
    repaymentSchedule = [],
    consumptionBehavior = [],
    repaymentTrends = [],
    financialAdvice = [],
    scoreSummary,
    scoreBands,
    applicationJourney = [],
  } = MOCK_BENEFICIARY_DATA;

  // scorePercentage (0-100)
  const scorePercentage = useMemo(() => {
    const raw = Number(creditScore) / 1000 * 100;
    return Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
  }, [creditScore]);

  // memoize formatted repayment schedule if heavy
  const formattedRepayments = useMemo(() => repaymentSchedule.map(p => ({ ...p })), [repaymentSchedule]);

  // handle navigation + tabs
  const handleTabChange = (value: string) => {
    // update query param without scroll
    router.push(`/dashboard?tab=${encodeURIComponent(value)}`, { scroll: false });
  };

  const handleSaveBill = (bill: BillParserOutput) => {
    setSavedBills(prev => [...prev, bill]);
    toast({
      title: safeT(t, 'parsed_bill_data', 'Parsed bill added'),
      description: safeT(t, 'saved_bills_desc', ''),
    });
  };

  useEffect(() => {
    if (rescoreStatus === 'pending') {
      const timer = setTimeout(() => {
        setRescoreStatus('completed');
        toast({
          title: safeT(t, 'request_rescore', 'Re-score complete'),
          description: safeT(t, 'request_rescore_pending', 'Re-scoring completed.'),
        });
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [rescoreStatus, toast, t]);

  const handleRescoreRequest = () => {
    if (rescoreStatus === 'pending') return;
    setRescoreStatus('pending');
    toast({
      title: safeT(t, 'request_rescore', 'Re-score requested'),
      description: safeT(t, 'request_rescore_pending', 'Re-scoring in progress...'),
    });
  };

  const handleMockUpload = () => {
    if (isUploading) return;
    setIsUploading(true);
    toast({
      title: 'Uploading',
      description: 'Parsing your document for verification...',
    });
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: 'Document added',
        description: 'Your document now helps strengthen your profile.',
      });
    }, 1600);
  };



  const handleLoanTypeSelection = async (type: LoanType) => {
    setSelectedLoanType(type);
    if (type === 'group') {
      setShowGroupSelectionDialog(true);
    } else {
      setShowConsentDialog(true);
    }
  };

  const handleGroupSelection = async (groupId: number) => {
    setSelectedGroupId(groupId);
    // Find group name from groups
    const groups = await loanApplicationService.getUserGroups();
    const selectedGroup = groups.find(g => g.groupId === groupId);
    setSelectedGroupName(selectedGroup?.groupName);
    setShowConsentDialog(true);
  };

  const handleLoanConsent = async () => {
    try {
      const consentData: ConsentData = {
        loanType: selectedLoanType,
        groupId: selectedGroupId,
        agreedToTerms: true,
        consentTimestamp: new Date().toISOString(),
      };

      await loanApplicationService.submitLoanConsent(consentData);

      toast({
        title: 'Consent Recorded',
        description: 'Redirecting you to loan schemes...',
      });

      // Navigate to schemes tab
      setTimeout(() => {
        router.push('/dashboard?tab=schemes');
      }, 1000);
    } catch (error) {
      console.error('Failed to submit consent:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record consent. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="overview" aria-label="Beneficiary dashboard tabs">
        {/* -------------------- Overview -------------------- */}
        <TabsContent value="overview" className="space-y-8 mt-0 p-1" aria-live="polite">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 overflow-hidden border-0 bg-gradient-to-br from-[#2B4C7E] via-[#3B9B7A] via-[#5FB996] to-[#E8B44F] text-white shadow-2xl relative group">
              {/* Animated background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

              <CardContent className="relative p-8 lg:p-10">
                {/* Header Label */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/90 font-semibold">
                    {safeT(t, 'composite_score_card_title', 'Composite Beneficiary Score')}
                  </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Section - Score Circle & Info */}
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
                    {/* Score Circle with Glow */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                      <ScorePie value={scorePercentage} score={creditScore} t={t} />
                    </div>

                    {/* Score Details */}
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-5xl font-bold tracking-tight mb-3">
                          {scoreSummary?.label ?? 'Confident Low Risk'}
                        </h2>
                        <p className="text-lg text-white/95 leading-relaxed max-w-md font-medium">
                          {scoreSummary?.opportunity ?? 'Eligible for ₹2,00,000 micro-loan'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge className="bg-white/30 hover:bg-white/40 text-white border-white/40 backdrop-blur-md px-4 py-1.5 text-sm font-semibold shadow-lg">
                          <ShieldCheck className="w-4 h-4 mr-1.5" />
                          {riskLevel}
                        </Badge>
                        <div className="text-sm text-white/80">
                          Last updated: <span className="font-medium">{scoreSummary?.updatedAt ?? 'Updated 2 hrs ago'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions & Score Display */}
                  <div className="flex flex-col items-center lg:items-end gap-6">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="bg-white/95 hover:bg-white text-[#2B4C7E] font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-6 text-base"
                      onClick={handleRescoreRequest}
                      disabled={rescoreStatus === 'pending'}
                      aria-disabled={rescoreStatus === 'pending'}
                      aria-label={safeT(t, 'request_rescore', 'Request re-score')}
                    >
                      {rescoreStatus === 'pending' ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {safeT(t, 'request_rescore_pending', 'Re-scoring in progress…')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5" />
                          {safeT(t, 'request_rescore', 'Request Re-Score')}
                        </>
                      )}
                    </Button>



                    <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
                      <div className="text-5xl font-bold mb-1">{creditScore}</div>
                      <div className="text-sm text-white/90 font-medium tracking-wide">UDAAN Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  {safeT(t, 'risk_income_bands', 'Risk & Income Bands')}
                </CardTitle>
                <CardDescription>{safeT(t, 'score_factors', 'Score factors')}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                {(['risk', 'income'] as const).map((type) => (
                  <div key={type}>
                    <p className="text-xs uppercase text-muted-foreground">{type === 'risk' ? 'Risk Band' : 'Income Band'}</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={scoreBands?.[type] ?? []}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={40}
                            outerRadius={55}
                            strokeWidth={2}
                          >
                            {(scoreBands?.[type] ?? []).map((slice) => (
                              <Cell key={slice.name} fill={slice.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {(scoreBands?.[type] ?? []).map((slice) => (
                        <li key={slice.name} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span>{slice.name}</span>
                          <span className="font-semibold text-foreground ml-auto">{slice.value}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="h-4 w-4 text-white" />
                  </div>
                  {safeT(t, 'ai_score_insights', 'AI Score & Insights')}
                </CardTitle>
                <CardDescription className="text-base">{safeT(t, 'explainability_reasons', 'Why you were approved')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No insights available yet.</p>
                  </div>
                ) : (
                  insights.map((insight, i) => (
                    <div key={i} className="group flex items-start gap-4 rounded-xl border bg-gradient-to-r from-green-50/50 to-emerald-50/30 p-4 transition-all hover:shadow-md hover:from-green-50 hover:to-emerald-50">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                        <ThumbsUp className="h-4 w-4 text-green-600" aria-hidden />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <UploadCloud className="h-4 w-4 text-white" />
                  </div>
                  {safeT(t, 'official_documents', 'Official Documents')}
                </CardTitle>
                <CardDescription>{safeT(t, 'official_documents_desc', 'Manage your verified identity proofs')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Uploaded Documents List */}
                {(profileData?.casteCertificateUrl || profileData?.identityProofUrl) && (
                  <div className="space-y-2 mb-4">
                    {profileData?.casteCertificateUrl && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">Caste Certificate</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleDownload('caste')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {profileData?.identityProofUrl && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">Identity Proof</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleDownload('identity')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center transition-all hover:border-blue-300 hover:bg-blue-50/50">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <UploadCloud className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Upload or replace documents</p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    onClick={() => setShowDocumentManager(true)}
                  >
                    {safeT(t, 'manage_documents', 'Manage Documents')}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/50 rounded-lg p-2">
                  <ShieldCheck className="h-3 w-3 text-green-600" />
                  <span>GDPR compliant secure storage</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* -------------------- Repayments -------------------- */}
        <TabsContent value="repayments" className="space-y-8 mt-0 p-1">
          <LoanList
            onPayNow={(loan) => {
              setSelectedLoan(loan);
              setShowPaymentDialog(true);
            }}
            onViewDetails={(loan) => {
              router.push(`/dashboard/loans/${loan.loanId}`);
            }}
            activeOnly={false}
          />

          <PaymentDialog
            loan={selectedLoan}
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            onSuccess={() => {
              // Refresh loan list by forcing re-render
              // The LoanList component will automatically refresh when the dialog closes
            }}
          />
        </TabsContent>

        {/* -------------------- Profile -------------------- */}
        {/* -------------------- Profile -------------------- */}
        <TabsContent value="profile" className="space-y-8 mt-0 p-1">
          <BeautifulProfile
            profile={profileData}
            user={user}
            savedBills={consumptionEntries}
            applications={applications}
            onEditProfile={() => setShowEditDialog(true)}
            onManageDocuments={() => setShowDocumentManager(true)}
            loading={!profileData && !user}
          />

          <EditProfileDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            initialData={profileData || {
              fullName: user?.name || '',
              addressLine: '',
              district: '',
              state: '',
              pincode: '',
              regionType: 'RURAL',
            }}
            onSuccess={() => {
              fetchProfile(); // Refresh profile after update
              toast({
                title: safeT(t, 'profile_updated', 'Profile Updated'),
                description: safeT(t, 'profile_updated_desc', 'Your profile has been updated successfully'),
              });
            }}
          />

          <DocumentManagerDialog
            open={showDocumentManager}
            onOpenChange={setShowDocumentManager}
            profile={profileData}
            onRefresh={fetchProfile}
          />
        </TabsContent>

        {/* -------------------- Applications -------------------- */}
        <TabsContent value="applications" className="space-y-8 mt-0 p-1">
          <MyApplicationsList
            onApplyNew={() => router.push('/dashboard?tab=apply-loan')}
            isAdmin={user?.role === 'officer'}
          />
        </TabsContent>

        {/* -------------------- Advice -------------------- */}
        <TabsContent value="advice" className="space-y-8 mt-0 p-1">
          <Card>
            <CardHeader>
              <CardTitle>{safeT(t, 'ai_financial_advice', 'AI Financial Advice')}</CardTitle>
              <CardDescription>{safeT(t, 'personalized_tips', '')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {financialAdvice.length === 0 ? (
                <p className="text-sm text-muted-foreground">No advice available right now.</p>
              ) : (
                financialAdvice.map(item => (
                  <div key={item.id} className="flex items-start space-x-4 rounded-lg border p-4 transition-all hover:shadow-md hover:bg-muted/50">
                    <div className="flex-shrink-0 pt-1"><Lightbulb className="h-6 w-6 text-primary" /></div>
                    <div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.advice}</p></div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- Bill Upload -------------------- */}
        <TabsContent value="bill-upload" className="mt-0 p-1">
          <BillUpload onBillConfirmed={handleSaveBill} />
        </TabsContent>
      </Tabs >
      <DocumentManagerDialog
        open={showDocumentManager}
        onOpenChange={setShowDocumentManager}
        profile={profileData}
        onRefresh={fetchProfile}
      />

      {/* Loan Application Flow Dialogs */}


      <GroupSelectionDialog
        open={showGroupSelectionDialog}
        onOpenChange={setShowGroupSelectionDialog}
        onSelectGroup={handleGroupSelection}
      />

      <LoanConsentDialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        loanType={selectedLoanType}
        groupId={selectedGroupId}
        groupName={selectedGroupName}
        onConsent={handleLoanConsent}
      />
    </div >
  );
}
