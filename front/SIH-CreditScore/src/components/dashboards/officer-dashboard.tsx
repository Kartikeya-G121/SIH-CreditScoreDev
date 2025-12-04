
'use client';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  MoreHorizontal,
  Flag,
  ShieldAlert,
  TrendingUp,
  MapPin,
  Filter,
  FileText,
  AlertCircle,
  ThumbsUp,
  Meh,
  IndianRupee,
  Users,
  Wallet,
  Activity,
  Download,
} from 'lucide-react';
import { MOCK_BENEFICIARIES_LIST, MOCK_ADMIN_DATA } from '@/lib/data';
import { StatCard } from '../shared/stat-card';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip as RechartsTooltip,
} from '../ui/chart';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RiskMonitoringCenter from './risk-monitoring-center';
import { IndiaRepaymentHeatmap } from './india-repayment-heatmap';

type Beneficiary = (typeof MOCK_BENEFICIARIES_LIST)[0];

const riskVariant: { [key: string]: 'default' | 'destructive' | 'outline' } = {
  Low: 'default',
  Medium: 'outline',
  High: 'destructive',
};
const riskColorClass = {
  Low: 'bg-green-600 text-white',
  Medium: 'bg-yellow-500 text-white',
  High: 'bg-destructive text-destructive-foreground',
};
const riskIcon = {
  Low: <ThumbsUp className="h-5 w-5 text-green-600" />,
  Medium: <Meh className="h-5 w-5 text-yellow-500" />,
  High: <AlertCircle className="h-5 w-5 text-destructive" />,
};

const INCOME_THRESHOLD = 50000;

function RiskAnalysisDialog({
  beneficiary,
  open,
  onOpenChange,
}: {
  beneficiary: Beneficiary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!beneficiary) return null;

  const compositeScore = beneficiary.score;
  const repaymentScore = Math.min(1000, Math.round(compositeScore * 1.05));
  const incomeScore = Math.min(1000, Math.round(compositeScore * 0.78));
  const fraudRisk = Math.max(5, Math.min(25, Math.round((1000 - compositeScore) / 40)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl bg-muted">
              {beneficiary.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{beneficiary.name}</h2>
            <p className="text-muted-foreground">{beneficiary.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Credit Score Analysis */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Credit Score Analysis</h3>

              <div className="bg-muted/30 rounded-lg p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Composite Beneficiary Score</p>
                <div className="text-6xl font-bold text-blue-600">{compositeScore}</div>
                <Badge className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1 text-sm">
                  Low Risk - Low Need
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Repayment</p>
                  <p className="text-2xl font-bold text-blue-700">{repaymentScore}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-600 font-medium mb-1">Income</p>
                  <p className="text-2xl font-bold text-green-700">{incomeScore}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-red-600 font-medium mb-1">Fraud Risk</p>
                  <p className="text-2xl font-bold text-red-700">{fraudRisk}%</p>
                </div>
              </div>
            </div>

            {/* Historical Loan Performance */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Historical Loan Performance</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-1 bg-blue-600 rounded"></div>
                  <span className="text-sm text-muted-foreground">Repayment Consistency</span>
                </div>
                <div className="h-48 flex items-end justify-between gap-2 border-l border-b border-muted pl-2 pb-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                    const height = 70 + Math.random() * 30;
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground">{month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0</span>
                  <span>110</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - XAI & Profile */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Score Explainability (XAI)</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Key Score Factors:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Repayment Performance</p>
                        <p className="text-sm text-muted-foreground">Repayment rate is 100%</p>
                      </div>
                      <span className="text-green-600 font-semibold">+200 pts</span>
                    </div>
                    <div className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Repeat Borrower</p>
                        <p className="text-sm text-muted-foreground">Beneficiary has a history of previous loans</p>
                      </div>
                      <span className="text-green-600 font-semibold">+100 pts</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Consumption & Profile</h4>
                  <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Activity:</span>
                      <span className="font-medium">Retail Shop</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{beneficiary.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Electricity Usage:</span>
                      <span className="font-medium">250 kWh/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utility Bill Payments:</span>
                      <span className="font-medium text-green-600">On-Time</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Audit Trail</h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleString()}: Details Viewed by Admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface OfficerDashboardProps {
  activeTab?: string;
}

export default function OfficerDashboard({ activeTab = 'dashboard' }: OfficerDashboardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [beneficiaries, setBeneficiaries] = useState(MOCK_BENEFICIARIES_LIST);
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { stats, riskDistribution, aiForecast } = MOCK_ADMIN_DATA;

  const handleUpdateLoanStage = (
    beneficiaryId: string,
    stage: 'Approved' | 'Flagged'
  ) => {
    setBeneficiaries((prev) =>
      prev.map((b) => (b.id === beneficiaryId ? { ...b, loanStage: stage } : b))
    );
    toast({
      title: `Beneficiary ${stage}`,
      description: `The loan application has been marked as ${stage}.`,
    });
  };

  const handleViewRiskAnalysis = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setIsDialogOpen(true);
  };

  const stateRepaymentData = [
    { id: 'MH', name: 'Maharashtra', repaymentRate: 98, totalAmount: 45000000, beneficiaries: 125000 },
    { id: 'GJ', name: 'Gujarat', repaymentRate: 92, totalAmount: 38000000, beneficiaries: 98000 },
    { id: 'AP', name: 'Andhra Pradesh', repaymentRate: 89, totalAmount: 32000000, beneficiaries: 87000 },
    { id: 'UP', name: 'Uttar Pradesh', repaymentRate: 95, totalAmount: 52000000, beneficiaries: 145000 },
    { id: 'BR', name: 'Bihar', repaymentRate: 88, totalAmount: 28000000, beneficiaries: 76000 },
    { id: 'RJ', name: 'Rajasthan', repaymentRate: 99, totalAmount: 41000000, beneficiaries: 102000 },
    { id: 'WB', name: 'West Bengal', repaymentRate: 91, totalAmount: 35000000, beneficiaries: 92000 },
    { id: 'TN', name: 'Tamil Nadu', repaymentRate: 96, totalAmount: 48000000, beneficiaries: 118000 },
    { id: 'KA', name: 'Karnataka', repaymentRate: 94, totalAmount: 44000000, beneficiaries: 108000 },
    { id: 'KL', name: 'Kerala', repaymentRate: 97, totalAmount: 29000000, beneficiaries: 68000 },
    { id: 'MP', name: 'Madhya Pradesh', repaymentRate: 87, totalAmount: 36000000, beneficiaries: 95000 },
    { id: 'OD', name: 'Odisha', repaymentRate: 86, totalAmount: 24000000, beneficiaries: 64000 },
    { id: 'TG', name: 'Telangana', repaymentRate: 93, totalAmount: 31000000, beneficiaries: 78000 },
    { id: 'PB', name: 'Punjab', repaymentRate: 90, totalAmount: 22000000, beneficiaries: 54000 },
    { id: 'HR', name: 'Haryana', repaymentRate: 91, totalAmount: 26000000, beneficiaries: 61000 },
    { id: 'JH', name: 'Jharkhand', repaymentRate: 84, totalAmount: 19000000, beneficiaries: 52000 },
    { id: 'CT', name: 'Chhattisgarh', repaymentRate: 85, totalAmount: 21000000, beneficiaries: 58000 },
    { id: 'AS', name: 'Assam', repaymentRate: 83, totalAmount: 18000000, beneficiaries: 49000 },
    { id: 'HP', name: 'Himachal Pradesh', repaymentRate: 88, totalAmount: 12000000, beneficiaries: 32000 },
    { id: 'UK', name: 'Uttarakhand', repaymentRate: 89, totalAmount: 14000000, beneficiaries: 36000 },
    { id: 'JK', name: 'Jammu & Kashmir', repaymentRate: 82, totalAmount: 16000000, beneficiaries: 42000 },
    { id: 'DL', name: 'Delhi', repaymentRate: 95, totalAmount: 27000000, beneficiaries: 65000 },
    { id: 'GA', name: 'Goa', repaymentRate: 96, totalAmount: 8000000, beneficiaries: 18000 },
    { id: 'AR', name: 'Arunachal Pradesh', repaymentRate: 79, totalAmount: 6000000, beneficiaries: 15000 },
    { id: 'NL', name: 'Nagaland', repaymentRate: 80, totalAmount: 5000000, beneficiaries: 12000 },
    { id: 'MN', name: 'Manipur', repaymentRate: 81, totalAmount: 5500000, beneficiaries: 14000 },
    { id: 'MZ', name: 'Mizoram', repaymentRate: 78, totalAmount: 4500000, beneficiaries: 11000 },
    { id: 'TR', name: 'Tripura', repaymentRate: 82, totalAmount: 7000000, beneficiaries: 17000 },
    { id: 'ML', name: 'Meghalaya', repaymentRate: 80, totalAmount: 6500000, beneficiaries: 16000 },
    { id: 'SK', name: 'Sikkim', repaymentRate: 85, totalAmount: 4000000, beneficiaries: 9000 },
  ];

  const filteredBeneficiaries = useMemo(() => {
    if (riskFilter === 'All') {
      return beneficiaries;
    }
    return beneficiaries.filter((b) => b.risk === riskFilter);
  }, [beneficiaries, riskFilter]);

  // Render Risk Monitoring Center if that tab is active
  if (activeTab === 'risk-monitoring') {
    return <RiskMonitoringCenter />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Beneficiaries"
          value={stats.totalBeneficiaries}
          icon={<Users className="h-4 w-4" />}
          description="+20.1% from last month"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          icon={<Wallet className="h-4 w-4" />}
          description="+180.1% from last month"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
        <StatCard
          title="Average Score"
          value={stats.averageScore}
          icon={<TrendingUp className="h-4 w-4" />}
          description="+12 since last month"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
        <StatCard
          title="Regional Default Rate"
          value={`${stats.regionalDefaultRate}`}
          icon={<Activity className="h-4 w-4" />}
          description="-1.2% from last month"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>AI Forecast Graph</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <AreaChart data={aiForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="score"
                      indicator="dot"
                      hideLabel
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: 'Beneficiaries' },
              }}
              className="h-[300px] w-full"
            >
              <PieChart>
                <RechartsTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie data={riskDistribution} dataKey="value" nameKey="name">
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Top Performing Region"
          value="Rajasthan"
          icon={<TrendingUp className="h-4 w-4" />}
          description="99% repayment rate"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
        <StatCard
          title="Default Prediction Alert"
          value="3 High-Risk Profiles"
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
          description="In West Bengal"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
        <StatCard
          title="Most Active Region"
          value="Maharashtra"
          icon={<MapPin className="h-4 w-4" />}
          description="Highest loan applications"
          className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{t('officer_beneficiaries_title')}</CardTitle>
            <CardDescription>{t('officer_beneficiaries_desc')}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> {t('officer_filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Risk</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={riskFilter}
                onValueChange={setRiskFilter}
              >
                <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Low">Low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Medium">
                  Medium
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="High">High</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('officer_table_beneficiary')}</TableHead>
                <TableHead>{t('officer_table_region')}</TableHead>
                <TableHead>Income Level</TableHead>
                <TableHead>{t('officer_table_ai_score')}</TableHead>
                <TableHead>{t('officer_table_risk')}</TableHead>
                <TableHead>{t('officer_table_loan_stage')}</TableHead>
                <TableHead className="text-right">
                  {t('officer_table_actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiaries.map((beneficiary) => {
                const isHighIncome = beneficiary.income >= INCOME_THRESHOLD;
                return (
                  <TableRow
                    key={beneficiary.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {beneficiary.name}
                    </TableCell>
                    <TableCell>{beneficiary.region}</TableCell>
                    <TableCell>
                      <Badge
                        variant={isHighIncome ? 'secondary' : 'outline'}
                        className={cn(
                          isHighIncome
                            ? 'text-green-700 border-green-700/50'
                            : 'text-amber-700 border-amber-700/50'
                        )}
                      >
                        {isHighIncome ? 'High' : 'Low'}
                      </Badge>
                    </TableCell>
                    <TableCell>{beneficiary.score}</TableCell>
                    <TableCell>
                      <Badge
                        variant={riskVariant[beneficiary.risk]}
                        className={
                          riskColorClass[
                          beneficiary.risk as keyof typeof riskColorClass
                          ]
                        }
                      >
                        {beneficiary.risk}
                      </Badge>
                    </TableCell>
                    <TableCell>{beneficiary.loanStage}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdateLoanStage(beneficiary.id, 'Approved')
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() =>
                              handleUpdateLoanStage(beneficiary.id, 'Flagged')
                            }
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Flag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onSelect={() => handleViewRiskAnalysis(beneficiary)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Risk Analysis
                          </DropdownMenuItem>

                          <DropdownMenuItem>
                            Request Verification
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RiskAnalysisDialog
        beneficiary={selectedBeneficiary}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            Repayment by State - India Heatmap
          </CardTitle>
          <CardDescription className="text-base">
            Interactive visualization of repayment rates across Indian states. States with higher repayment rates glow brighter.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <IndiaRepaymentHeatmap data={stateRepaymentData} className="w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              Generate comprehensive policy reports based on current data and
              trends.
            </p>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Generate Policy Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
