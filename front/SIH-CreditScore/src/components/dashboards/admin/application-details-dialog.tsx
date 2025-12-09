import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    User,
    FileText,
    CreditCard,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Building,
    FileCheck,
    TrendingUp,
    Ban,
    IndianRupee,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ApplicationDetail } from '@/services/application-analytics-service';
import { loanApplicationService } from '@/services/loan-application-service';

interface ApplicationDetailsDialogProps {
    application: ApplicationDetail | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Callback to refresh list after action
}

const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
    SUBMITTED: { label: 'Submitted', color: 'bg-blue-500', icon: FileCheck },
    SCORING: { label: 'Scoring', color: 'bg-purple-500', icon: TrendingUp },
    AI_APPROVED: { label: 'AI Approved', color: 'bg-emerald-500', icon: CheckCircle },
    MANUAL_REVIEW: { label: 'Manual Review', color: 'bg-amber-500', icon: AlertCircle },
    APPROVED: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
    SANCTIONED: { label: 'Sanctioned', color: 'bg-emerald-700', icon: CheckCircle },
    WITHDRAWN: { label: 'Withdrawn', color: 'bg-orange-500', icon: Ban },
};

export function ApplicationDetailsDialog({
    application,
    isOpen,
    onClose,
    onUpdate,
}: ApplicationDetailsDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewComments, setReviewComments] = useState('');
    const [sanctionAmount, setSanctionAmount] = useState<string>('');
    const [interestRate, setInterestRate] = useState<string>('');

    // Pre-fill sanction details when dialog opens or application changes
    useEffect(() => {
        if (application && (application.status === 'APPROVED' || application.status === 'AI_APPROVED')) {
            const fee = application.processingFee || 0;
            const amount = application.requestedAmount - fee;
            setSanctionAmount(amount.toString());

            if (application.interestRate) {
                setInterestRate(application.interestRate.toString());
            }
        } else {
            setSanctionAmount('');
            setInterestRate('');
        }
    }, [application]);

    // Reset form when dialog opens/application changes
    if (!application) return null;

    const StatusIcon = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;

    const formatCurrency = (amount: number | null | undefined) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
        } catch {
            return dateString;
        }
    };

    const handleReview = async (approved: boolean) => {
        try {
            setIsSubmitting(true);
            await loanApplicationService.reviewApplication(application.applicationId, {
                approved,
                comments: reviewComments || (approved ? 'Approved by officer' : 'Rejected by officer'),
            });
            toast({
                title: approved ? 'Application Approved' : 'Application Rejected',
                description: `Application #${application.applicationId} has been ${approved ? 'approved' : 'rejected'}.`,
            });
            onUpdate();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to review application',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSanction = async () => {
        if (!sanctionAmount || !interestRate) {
            toast({
                title: 'Validation Error',
                description: 'Please enter sanction amount and interest rate',
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsSubmitting(true);
            await loanApplicationService.sanctionApplication(application.applicationId, {
                amount: parseFloat(sanctionAmount),
                interestRate: parseFloat(interestRate),
            });
            toast({
                title: 'Application Sanctioned',
                description: `Application #${application.applicationId} has been sanctioned successfully.`,
            });
            onUpdate();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to sanction application',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-2xl">Application #{application.applicationId}</DialogTitle>
                            <Badge
                                variant="outline"
                                className={`${STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500'} text-white border-0 px-3 py-1`}
                            >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG]?.label || application.status}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(application.createdAt)}
                        </div>
                    </div>
                    <DialogDescription>
                        Review details for {application.userName || 'Unknown Applicant'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="beneficiary">Beneficiary</TabsTrigger>
                        <TabsTrigger value="scheme">Scheme</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5 text-primary" />
                                    Loan Request
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                                    <div>
                                        <Label className="text-muted-foreground">Requested Amount</Label>
                                        <p className="text-xl font-bold">{formatCurrency(application.requestedAmount)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Tenure</Label>
                                        <p className="text-xl font-bold">{application.tenureMonths} Months</p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-muted-foreground">Purpose</Label>
                                        <p className="font-medium break-words">{application.purpose || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Applicant Summary
                                </h3>
                                <div className="border p-4 rounded-lg bg-muted/20 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{application.userName || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{application.userEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{application.userPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{application.district}, {application.state}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credit Score & Risk Assessment Section */}
                        {(application.riskScore || application.compositeScore || application.riskBucket || application.incomeBucket) && (
                            <div className="border-t pt-4 mt-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Credit Score & Risk Assessment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Composite Credit Score */}
                                    {application.compositeScore && (
                                        <div className="border p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                                            <Label className="text-muted-foreground text-sm">Composite Credit Score</Label>
                                            <p className="text-4xl font-bold text-blue-600 mt-2">{application.compositeScore}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
                                        </div>
                                    )}

                                    {/* Risk Score */}
                                    {application.riskScore && (
                                        <div className={`border p-4 rounded-lg ${application.riskScore < 40 ? 'bg-green-50 dark:bg-green-950/20 border-green-200' :
                                                application.riskScore < 70 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200' :
                                                    'bg-red-50 dark:bg-red-950/20 border-red-200'
                                            }`}>
                                            <Label className="text-muted-foreground text-sm">Risk Score</Label>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <p className={`text-4xl font-bold ${application.riskScore < 40 ? 'text-green-600' :
                                                        application.riskScore < 70 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                    }`}>{application.riskScore}</p>
                                                {application.riskBucket && (
                                                    <Badge variant="outline" className={`${application.riskBucket === 'LOW' ? 'bg-green-500 text-white' :
                                                            application.riskBucket === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                                                'bg-red-500 text-white'
                                                        } border-0`}>
                                                        {application.riskBucket} RISK
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Income Bucket */}
                                    {application.incomeBucket && (
                                        <div className="border p-4 rounded-lg bg-muted/20">
                                            <Label className="text-muted-foreground text-sm">Income Category</Label>
                                            <p className="text-2xl font-bold mt-2">{application.incomeBucket}</p>
                                            {application.incomeConfidence && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Confidence: {(application.incomeConfidence * 100).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Section based on Status */}
                        {/* Review actions for SUBMITTED and MANUAL_REVIEW */}
                        {(application.status === 'SUBMITTED' || application.status === 'MANUAL_REVIEW') && (
                            <div className="border-t pt-4 mt-6">
                                <h3 className="text-lg font-semibold mb-4">Review Application</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="comments">Review Comments</Label>
                                        <Textarea
                                            id="comments"
                                            placeholder="Enter comments for approval or rejection..."
                                            value={reviewComments}
                                            onChange={(e) => setReviewComments(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleReview(true)}
                                            disabled={isSubmitting}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleReview(false)}
                                            disabled={isSubmitting}
                                            variant="destructive"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sanction actions for APPROVED and AI_APPROVED */}
                        {(application.status === 'APPROVED' || application.status === 'AI_APPROVED') && (
                            <div className={`border-t pt-4 mt-6 ${application.status === 'SCORING' ? 'opacity-60' : ''}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5 text-primary" />
                                    Sanction Loan
                                </h3>
                                <div className="border p-4 rounded-lg space-y-4 relative">
                                    {(application.status === 'SCORING' || application.status === 'MANUAL_REVIEW' || application.status === 'SUBMITTED') && (
                                        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
                                            <div className="bg-background border px-4 py-2 rounded-md shadow-sm text-sm font-medium">
                                                {application.status === 'SCORING' ? 'Waiting for ML scoring...' : 'Approve application first'}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sanctionAmount">Sanction Amount</Label>
                                            <Input
                                                id="sanctionAmount"
                                                type="number"
                                                value={sanctionAmount}
                                                onChange={(e) => setSanctionAmount(e.target.value)}
                                                disabled={application.status === 'SCORING'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="interestRate">Interest Rate (%)</Label>
                                            <Input
                                                id="interestRate"
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(e.target.value)}
                                                disabled={application.status === 'SCORING'}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleSanction}
                                        disabled={isSubmitting || !['APPROVED', 'AI_APPROVED'].includes(application.status)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Sanction Loan
                                    </Button>
                                </div>
                            </div>
                        )}

                        {application.status === 'SANCTIONED' && (
                            <div className="border-t pt-4 mt-6">
                                <h3 className="text-lg font-semibold mb-4 text-emerald-600 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Sanction Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100">
                                    <div>
                                        <Label className="text-muted-foreground">Sanctioned Amount</Label>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(application.sanctionedAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Final Interest Rate</Label>
                                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                            {application.finalInterestRate}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* BENEFICIARY TAB */}
                    <TabsContent value="beneficiary" className="mt-4">
                        <div className="border rounded-lg p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-muted-foreground">Full Name</Label>
                                    <p className="font-medium text-lg">{application.userName || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{application.userEmail}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{application.userPhone}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Group</Label>
                                    <p className="font-medium">{application.groupName ? `${application.groupName} (ID: ${application.groupId})` : 'Individual Applicant'}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Address Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">State</Label>
                                        <p className="font-medium">{application.state || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">District</Label>
                                        <p className="font-medium">{application.district || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* SCHEME TAB */}
                    <TabsContent value="scheme" className="mt-4">
                        <div className="border rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Building className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{application.schemeName || 'Unknown Scheme'}</h3>
                                    <p className="text-muted-foreground">Scheme ID: {application.schemeId}</p>
                                </div>
                            </div>

                            {/* Placeholder for scheme details - in a real app, we might fetch scheme details by ID */}
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    Detailed scheme information is available in the Schemes module.
                                    This application is linked to Scheme #{application.schemeId}.
                                </p>
                            </div>
                        </div>
                    </TabsContent>


                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
