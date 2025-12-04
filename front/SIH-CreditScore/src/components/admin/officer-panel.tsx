'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Users,
  Wallet,
  Activity,
  Download,
  PauseCircle,
  Search,
  Loader2,
  BarChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
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
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip as RechartsTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/shared/stat-card';
import { MOCK_ADMIN_DATA, MOCK_BENEFICIARIES_LIST } from '@/lib/data';
import ModuleToggleCenter from '@/components/dashboards/module-toggle-center';
import DocumentVerificationWorkspace from '@/components/dashboards/document-verification-workspace';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const actionConsole = [
  {
    id: 'approve',
    title: 'Approve',
    description: 'Fast-track low-risk beneficiaries',
    icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    tone: 'bg-emerald-50 border-emerald-100',
  },
  {
    id: 'hold',
    title: 'Hold',
    description: 'Request additional field verification',
    icon: <PauseCircle className="h-5 w-5 text-amber-600" />,
    tone: 'bg-amber-50 border-amber-100',
  },
  {
    id: 'reject',
    title: 'Reject',
    description: 'Flagged for fraud or mismatch',
    icon: <ShieldAlert className="h-5 w-5 text-red-600" />,
    tone: 'bg-red-50 border-red-100',
  },
];

const verificationTimeline = [
  { id: 't1', stage: 'Documents Uploaded', time: '08:42 IST', status: 'done' },
  { id: 't2', stage: 'OCR & Fraud Scan', time: '08:44 IST', status: 'done' },
  { id: 't3', stage: 'Officer Review', time: '08:55 IST', status: 'current' },
  { id: 't4', stage: 'Disbursement Queue', time: 'Pending', status: 'upcoming' },
];

const clusterQuadrants = [
  { name: 'Digital Ready MSME', need: 80, risk: 25, fill: '#1CA676' },
  { name: 'High Need Urban', need: 78, risk: 55, fill: '#F6A623' },
  { name: 'Manual Review Rural', need: 60, risk: 70, fill: '#D64550' },
  { name: 'Steady Borrowers', need: 35, risk: 20, fill: '#1F3D7A' },
];

const geoData = [
  { name: 'Maharashtra', repayment: 98 },
  { name: 'Gujarat', repayment: 92 },
  { name: 'Andhra', repayment: 85 },
  { name: 'UP', repayment: 95 },
  { name: 'Bihar', repayment: 88 },
  { name: 'Rajasthan', repayment: 99 },
];

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
  const risk = beneficiary.risk as keyof typeof riskIcon;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {riskIcon[risk]}
            Risk Analysis for {beneficiary.name}
          </DialogTitle>
          <DialogDescription>
            AI-generated insights into the beneficiary&apos;s credit risk profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-around rounded-lg bg-muted p-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">AI Score</p>
              <p className="text-2xl font-bold">{beneficiary.score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Level</p>
              <Badge
                variant={riskVariant[beneficiary.risk]}
                className={riskColorClass[beneficiary.risk as keyof typeof riskColorClass]}
              >
                {beneficiary.risk}
              </Badge>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Key Risk Factors:</h4>
            <ul className="space-y-2 list-disc list-inside">
              {beneficiary.riskFactors.map((factor, index) => (
                <li key={factor + index} className="text-sm text-foreground">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OfficerPanel() {
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

  const handleConsoleAction = (actionId: string) => {
    toast({
      title: `Action: ${actionId}`,
      description: 'This action will be wired to workflow automation in production.',
    });
  };

  const handleViewRiskAnalysis = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setIsDialogOpen(true);
  };

  const filteredBeneficiaries = useMemo(() => {
    if (riskFilter === 'All') {
      return beneficiaries;
    }
    return beneficiaries.filter((b) => b.risk === riskFilter);
  }, [beneficiaries, riskFilter]);

  const flaggedProfiles = useMemo(
    () => beneficiaries.filter((b) => b.risk !== 'Low').slice(0, 4),
    [beneficiaries]
  );

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Action Console</CardTitle>
            <CardDescription>Approve, hold, or reject in one tap.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {actionConsole.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleConsoleAction(action.id)}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow ${action.tone}`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {action.icon}
                  {action.title}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{action.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              UDAAN Application Timeline
            </CardTitle>
            <CardDescription>Real-time processing status with AI verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-muted"></div>
              <ol className="space-y-6">
                {verificationTimeline.map((step, index) => (
                  <li key={step.id} className="flex gap-4 relative">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        step.status === 'done'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : step.status === 'current'
                            ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                            : 'bg-background border-muted text-muted-foreground'
                      }`}
                    >
                      {step.status === 'done' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : step.status === 'current' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{step.stage}</p>
                        <Badge variant={step.status === 'done' ? 'default' : step.status === 'current' ? 'secondary' : 'outline'}>
                          {step.status === 'done' ? 'Completed' : step.status === 'current' ? 'In Progress' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                      {step.status === 'current' && (
                        <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full w-3/4 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Risk Monitoring Center
            </CardTitle>
            <CardDescription>AI-flagged profiles requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-2">
                {flaggedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-xl border-l-4 border-l-red-500 bg-red-50/50 p-3 text-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="font-semibold">{profile.name}</p>
                      </div>
                      <Badge
                        variant={riskVariant[profile.risk]}
                        className={
                          riskColorClass[
                            profile.risk as keyof typeof riskColorClass
                          ]
                        }
                      >
                        {profile.risk} Risk
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {profile.region} • AI Score: {profile.score}
                      </p>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
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
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              UDAAN Risk Distribution
            </CardTitle>
            <CardDescription>AI-powered risk categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: 'Beneficiaries' },
              }}
              className="h-[250px] w-full"
            >
              <PieChart>
                <RechartsTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie 
                  data={riskDistribution} 
                  dataKey="value" 
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-auto text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk-Need Quadrants</CardTitle>
          <CardDescription>Color-coded view of clusters requiring attention.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[320px] w-full">
            <ResponsiveContainer>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="need" domain={[0, 100]} />
                <YAxis type="number" dataKey="risk" domain={[0, 100]} />
                <Tooltip />
                <ReferenceLine x={50} stroke="hsl(var(--muted-foreground))" />
                <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" />
                <Scatter data={clusterQuadrants}>
                  {clusterQuadrants.map((cluster) => (
                    <Cell key={cluster.name} fill={cluster.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

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
          <div className="flex flex-col gap-4 pb-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search applications..." className="pl-8" />
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
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
                const isHighIncome = beneficiary.income >= 50000;
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
                        className={
                          isHighIncome
                            ? 'text-green-700 border-green-700/50'
                            : 'text-amber-700 border-amber-700/50'
                        }
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

      <Card>
        <CardHeader>
          <CardTitle>Repayment by State</CardTitle>
          <CardDescription>
            Visualization of repayment rates across key states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              repayment: { label: 'Repayment %', color: 'hsl(var(--primary))' },
            }}
            className="h-[300px] w-full"
          >
            <RechartsBarChart data={geoData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
              />
              <XAxis type="number" hide />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="repayment"
                radius={5}
                fill="var(--color-repayment)"
              />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <ModuleToggleCenter />

      <DocumentVerificationWorkspace />

      <Card>
        <CardHeader>
          <CardTitle>Reporting</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            Generate comprehensive policy reports based on current data and trends.
          </p>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Generate Policy Report
          </Button>
        </CardContent>
      </Card>

      <RiskAnalysisDialog
        beneficiary={selectedBeneficiary}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
