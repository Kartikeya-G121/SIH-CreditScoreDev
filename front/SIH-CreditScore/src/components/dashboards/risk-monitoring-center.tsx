'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertTriangle,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  TrendingDown,
  TrendingUp,
  FileText,
  User,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  Home,
  Briefcase,
  Search,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RiskProfile {
  id: string;
  name: string;
  state: string;
  aiScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  flaggedDate: string;
  lastActivity: string;
  avatar?: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  monthlyIncome: number;
  loanAmount: number;
  riskFactors: string[];
  creditHistory: string;
  documents: { type: string; status: 'verified' | 'pending' | 'rejected' }[];
  repaymentHistory: { month: string; status: 'paid' | 'late' | 'missed' }[];
}

const MOCK_RISK_PROFILES: RiskProfile[] = [
  {
    id: 'RP001',
    name: 'Diya Patel',
    state: 'Gujarat',
    aiScore: 650,
    riskLevel: 'Medium',
    flaggedDate: '2024-01-15',
    lastActivity: '2 hours ago',
    email: 'diya.patel@email.com',
    phone: '+91 98765 43210',
    address: 'Village Kheda, Anand District, Gujarat',
    occupation: 'Dairy Farmer',
    monthlyIncome: 25000,
    loanAmount: 150000,
    riskFactors: [
      'Irregular income pattern in monsoon months',
      'Limited credit history',
      'Seasonal business dependency'
    ],
    creditHistory: 'First-time borrower with basic savings account',
    documents: [
      { type: 'Aadhaar Card', status: 'verified' },
      { type: 'Income Certificate', status: 'pending' },
      { type: 'Bank Statements', status: 'verified' }
    ],
    repaymentHistory: [
      { month: 'Dec 2023', status: 'paid' },
      { month: 'Nov 2023', status: 'late' },
      { month: 'Oct 2023', status: 'paid' }
    ]
  },
  {
    id: 'RP002',
    name: 'Kiran Reddy',
    state: 'Andhra Pradesh',
    aiScore: 520,
    riskLevel: 'High',
    flaggedDate: '2024-01-12',
    lastActivity: '1 day ago',
    email: 'kiran.reddy@email.com',
    phone: '+91 87654 32109',
    address: 'Guntur District, Andhra Pradesh',
    occupation: 'Rice Farmer',
    monthlyIncome: 18000,
    loanAmount: 200000,
    riskFactors: [
      'Recent crop failure due to drought',
      'High debt-to-income ratio',
      'Multiple pending loans from other sources'
    ],
    creditHistory: 'Previous loan default in 2022, partial recovery',
    documents: [
      { type: 'Aadhaar Card', status: 'verified' },
      { type: 'Land Records', status: 'rejected' },
      { type: 'Income Certificate', status: 'pending' }
    ],
    repaymentHistory: [
      { month: 'Dec 2023', status: 'missed' },
      { month: 'Nov 2023', status: 'missed' },
      { month: 'Oct 2023', status: 'late' }
    ]
  },
  {
    id: 'RP003',
    name: 'Meena Kumari',
    state: 'Bihar',
    aiScore: 680,
    riskLevel: 'Medium',
    flaggedDate: '2024-01-10',
    lastActivity: '3 hours ago',
    email: 'meena.kumari@email.com',
    phone: '+91 76543 21098',
    address: 'Patna District, Bihar',
    occupation: 'Handicraft Artisan',
    monthlyIncome: 22000,
    loanAmount: 75000,
    riskFactors: [
      'Market volatility for handicraft products',
      'Limited digital payment adoption',
      'Seasonal demand fluctuations'
    ],
    creditHistory: 'Good repayment history with microfinance institutions',
    documents: [
      { type: 'Aadhaar Card', status: 'verified' },
      { type: 'Business Registration', status: 'verified' },
      { type: 'Bank Statements', status: 'pending' }
    ],
    repaymentHistory: [
      { month: 'Dec 2023', status: 'paid' },
      { month: 'Nov 2023', status: 'paid' },
      { month: 'Oct 2023', status: 'late' }
    ]
  },
  {
    id: 'RP004',
    name: 'Anita Das',
    state: 'West Bengal',
    aiScore: 590,
    riskLevel: 'High',
    flaggedDate: '2024-01-08',
    lastActivity: '5 hours ago',
    email: 'anita.das@email.com',
    phone: '+91 65432 10987',
    address: 'Hooghly District, West Bengal',
    occupation: 'Fish Vendor',
    monthlyIncome: 16000,
    loanAmount: 120000,
    riskFactors: [
      'Unstable market prices for fish',
      'No formal business registration',
      'Limited financial literacy'
    ],
    creditHistory: 'Mixed repayment history with local lenders',
    documents: [
      { type: 'Aadhaar Card', status: 'verified' },
      { type: 'Income Certificate', status: 'rejected' },
      { type: 'Residence Proof', status: 'pending' }
    ],
    repaymentHistory: [
      { month: 'Dec 2023', status: 'late' },
      { month: 'Nov 2023', status: 'paid' },
      { month: 'Oct 2023', status: 'missed' }
    ]
  }
];

const riskConfig = {
  Low: { 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Shield className="h-4 w-4" />,
    bgClass: 'bg-green-50'
  },
  Medium: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    bgClass: 'bg-yellow-50'
  },
  High: { 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    bgClass: 'bg-red-50'
  },
  Critical: { 
    color: 'bg-red-200 text-red-900 border-red-300',
    icon: <AlertTriangle className="h-4 w-4" />,
    bgClass: 'bg-red-100'
  }
};

interface ReviewDialogProps {
  profile: RiskProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewComplete: (profileId: string, decision: 'approved' | 'rejected' | 'needs_verification', notes: string) => void;
}

function ReviewDialog({ profile, open, onOpenChange, onReviewComplete }: ReviewDialogProps) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_verification' | null>(null);
  const [notes, setNotes] = useState('');

  if (!profile) return null;

  const handleSubmitReview = () => {
    if (decision) {
      onReviewComplete(profile.id, decision, notes);
      setDecision(null);
      setNotes('');
      onOpenChange(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getRepaymentIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'late': return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'missed': return <XCircle className="h-3 w-3 text-red-600" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                Risk Review: {profile.name}
                <Badge className={riskConfig[profile.riskLevel].color}>
                  {riskConfig[profile.riskLevel].icon}
                  {profile.riskLevel} Risk
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                AI Score: {profile.aiScore} • Flagged on {new Date(profile.flaggedDate).toLocaleDateString()}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.occupation}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{profile.address}</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Financial Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="font-semibold">₹{profile.monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-semibold">₹{profile.loanAmount.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Credit History</p>
                <p className="text-sm bg-muted p-2 rounded">{profile.creditHistory}</p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {profile.riskFactors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Documents Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">{doc.type}</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(doc.status)}
                      <span className="text-xs capitalize">{doc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Repayment History */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Repayment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {profile.repaymentHistory.map((payment, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">{payment.month}</span>
                    <div className="flex items-center gap-1">
                      {getRepaymentIcon(payment.status)}
                      <span className="text-xs capitalize font-medium">{payment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Review Decision */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Review Decision</Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={decision === 'approved' ? 'default' : 'outline'}
              className={cn(
                'h-auto p-4 flex flex-col gap-2',
                decision === 'approved' && 'bg-green-600 hover:bg-green-700'
              )}
              onClick={() => setDecision('approved')}
            >
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Approve Loan</span>
            </Button>
            <Button
              variant={decision === 'needs_verification' ? 'default' : 'outline'}
              className={cn(
                'h-auto p-4 flex flex-col gap-2',
                decision === 'needs_verification' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
              onClick={() => setDecision('needs_verification')}
            >
              <Clock className="h-5 w-5" />
              <span className="text-sm">Request Verification</span>
            </Button>
            <Button
              variant={decision === 'rejected' ? 'default' : 'outline'}
              className={cn(
                'h-auto p-4 flex flex-col gap-2',
                decision === 'rejected' && 'bg-red-600 hover:bg-red-700'
              )}
              onClick={() => setDecision('rejected')}
            >
              <XCircle className="h-5 w-5" />
              <span className="text-sm">Reject Application</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-notes">Review Notes</Label>
          <Textarea
            id="review-notes"
            placeholder="Add your review comments and reasoning..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReview}
            disabled={!decision}
            className={cn(
              decision === 'approved' && 'bg-green-600 hover:bg-green-700',
              decision === 'rejected' && 'bg-red-600 hover:bg-red-700',
              decision === 'needs_verification' && 'bg-yellow-600 hover:bg-yellow-700'
            )}
          >
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RiskMonitoringCenter() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState(MOCK_RISK_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const handleReview = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    setIsReviewOpen(true);
  };

  const handleReviewComplete = (profileId: string, decision: 'approved' | 'rejected' | 'needs_verification', notes: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    
    const decisionText = {
      approved: 'approved',
      rejected: 'rejected', 
      needs_verification: 'marked for verification'
    };

    toast({
      title: 'Review Completed',
      description: `${selectedProfile?.name} has been ${decisionText[decision]}.`,
    });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           profile.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || profile.riskLevel.toLowerCase() === riskFilter;
      const matchesState = stateFilter === 'all' || profile.state === stateFilter;
      
      return matchesSearch && matchesRisk && matchesState;
    });
  }, [profiles, searchTerm, riskFilter, stateFilter]);

  const riskCounts = useMemo(() => {
    return profiles.reduce((acc, profile) => {
      acc[profile.riskLevel] = (acc[profile.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [profiles]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(profiles.map(p => p.state)));
  }, [profiles]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">High Risk</p>
                <p className="text-2xl font-bold text-red-700">{riskCounts.High || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-700">{riskCounts.Medium || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Low Risk</p>
                <p className="text-2xl font-bold text-green-700">{riskCounts.Low || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Flagged</p>
                <p className="text-2xl font-bold text-blue-700">{profiles.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Profiles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                Risk Monitoring Center
              </CardTitle>
              <CardDescription>
                AI-flagged profiles requiring immediate attention
              </CardDescription>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[400px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className={cn(
                "transition-all duration-200 hover:shadow-lg cursor-pointer border-l-4",
                profile.riskLevel === 'High' && "border-l-red-500 hover:bg-red-50/50",
                profile.riskLevel === 'Medium' && "border-l-yellow-500 hover:bg-yellow-50/50",
                profile.riskLevel === 'Low' && "border-l-green-500 hover:bg-green-50/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{profile.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {profile.state}
                        </p>
                      </div>
                    </div>
                    <Badge className={riskConfig[profile.riskLevel].color}>
                      {profile.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Score:</span>
                      <span className="font-medium">{profile.aiScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span className="font-medium">{profile.lastActivity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loan Amount:</span>
                      <span className="font-medium">₹{profile.loanAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleReview(profile)}
                    variant={profile.riskLevel === 'High' ? 'destructive' : 'default'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfiles.length === 0 && profiles.length > 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {profiles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No high-risk profiles require immediate attention.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        profile={selectedProfile}
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  );
}