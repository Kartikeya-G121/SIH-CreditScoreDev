
export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'beneficiary' | 'officer';
  region: string;
  aadhaar?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'hi' | 'ur' | 'ta';
};

export const MOCK_USERS: User[] = [
  {
    id: 'usr_001',
    name: 'Aarav Sharma (Demo)',
    email: 'beneficiary@example.com',
    avatar: 'https://i.pravatar.cc/150?u=usr_001',
    role: 'beneficiary',
    region: 'Maharashtra',
    aadhaar: '5214 7810 2234',
    phone: '+91 9876543210',
    preferredLanguage: 'hi',
  },
  {
    id: 'usr_002',
    name: 'Priya Singh (Demo)',
    email: 'officer@example.com',
    avatar: 'https://i.pravatar.cc/150?u=usr_002',
    role: 'officer',
    region: 'National',
    aadhaar: '6543 1987 2200',
    phone: '+91 9988776655',
    preferredLanguage: 'en',
  },
  {
    id: 'usr_004',
    name: 'Sunita Devi',
    email: 'sunita.d@example.com',
    avatar: 'https://i.pravatar.cc/150?u=usr_004',
    role: 'beneficiary',
    region: 'Bihar',
    aadhaar: '3321 8845 1098',
    phone: '+91 9822011199',
    preferredLanguage: 'hi',
  },
  {
    id: 'usr_005',
    name: 'Amit Kumar',
    email: 'amit.k@example.com',
    avatar: 'https://i.pravatar.cc/150?u=usr_005',
    role: 'beneficiary',
    region: 'Uttar Pradesh',
    aadhaar: '4411 7788 5522',
    phone: '+91 9000034567',
    preferredLanguage: 'en',
  },
];

export const MOCK_BENEFICIARY_DATA = {
  creditScore: 786,
  riskLevel: 'Low',
  scoreSummary: {
    label: 'Confident Low Risk',
    updatedAt: 'Updated 2 hrs ago',
    opportunity: 'Eligible for ₹2,00,000 micro-loan',
    gradient: 'from-[#1CA676] to-[#1F3D7A]',
  },
  scoreBands: {
    risk: [
      { name: 'Low', value: 68, color: '#1CA676' },
      { name: 'Medium', value: 22, color: '#F6A623' },
      { name: 'High', value: 10, color: '#D64550' },
    ],
    income: [
      { name: 'Stable', value: 60, color: '#1F3D7A' },
      { name: 'Seasonal', value: 27, color: '#1CA676' },
      { name: 'Irregular', value: 13, color: '#F6A623' },
    ],
  },
  insights: [
    'Excellent repayment history.',
    'Diversified sources of income.',
    'Low credit utilization.',
  ],
  applicationJourney: [
    { id: 'profile', label: 'Profile Submitted', status: 'complete' },
    { id: 'documents', label: 'Documents Uploaded', status: 'complete' },
    { id: 'verification', label: 'Verification', status: 'current' },
    { id: 'scoring', label: 'AI Scoring', status: 'upcoming' },
    { id: 'disbursement', label: 'Disbursement', status: 'upcoming' },
  ],
  repaymentSchedule: [
    { id: 'pay_01', dueDate: '2024-08-05', amount: 5000, status: 'Paid' },
    { id: 'pay_02', dueDate: '2024-09-05', amount: 5000, status: 'Upcoming' },
    { id: 'pay_03', dueDate: '2024-10-05', amount: 5000, status: 'Upcoming' },
  ],
  consumptionBehavior: [
    { name: 'Jan', essential: 4000, discretionary: 2400 },
    { name: 'Feb', essential: 3000, discretionary: 1398 },
    { name: 'Mar', essential: 2000, discretionary: 9800 },
    { name: 'Apr', essential: 2780, discretionary: 3908 },
    { name: 'May', essential: 1890, discretionary: 4800 },
    { name: 'Jun', essential: 2390, discretionary: 3800 },
    { name: 'Jul', essential: 3490, discretionary: 4300 },
  ],
  repaymentTrends: [
    { name: 'Jan', paid: 5000, due: 5000 },
    { name: 'Feb', paid: 5000, due: 5000 },
    { name: 'Mar', paid: 5000, due: 5000 },
    { name: 'Apr', paid: 4500, due: 5000 },
    { name: 'May', paid: 5000, due: 5000 },
    { name: 'Jun', paid: 5000, due: 5000 },
    { name: 'Jul', paid: 5000, due: 5000 },
  ],
  financialAdvice: [
    { id: 'adv_1', title: 'Tip for Rural Entrepreneurs', advice: 'Consider using UPI for business transactions to create a digital footprint, which can improve your credit score.' },
    { id: 'adv_2', title: 'Saving for a Rainy Day', advice: 'Try to save at least 10% of your monthly income in a separate savings account for emergencies.' },
    { id: 'adv_3', title: 'Understanding Interest', advice: 'Always check the interest rate on any loan. A lower rate can save you a lot of money over time.' }
  ],
  xaiSummary: {
    highlights: [
      {
        title: 'Approval Boosters',
        bullets: [
          '100% on-time utility bill payments in last 12 months',
          'Mobile recharge pattern shows steady consumption',
          'Household income mapped to ₹38K stable inflows',
        ],
      },
      {
        title: 'Risk Mitigators',
        bullets: [
          'No duplicate documents detected',
          'Geo-tagged uploads match registered address',
          'Community cooperative membership verified',
        ],
      },
    ],
    contributions: [
      { feature: 'Utility payment cadence', value: 32, impact: 'positive' },
      { feature: 'Recharge frequency', value: 18, impact: 'positive' },
      { feature: 'Household income stability', value: 24, impact: 'positive' },
      { feature: 'Seasonal income dips', value: 12, impact: 'negative' },
      { feature: 'Manual verification pending', value: 8, impact: 'negative' },
    ],
    simplified: [
      {
        title: 'Payments',
        description: 'Your timely electricity and mobile payments increased your score.',
      },
      {
        title: 'Income',
        description: 'Stable monthly income and additional support from community cooperative helped.',
      },
      {
        title: 'Next Step',
        description: 'Loan disbursement is possible as soon as field verification is complete.',
      },
    ],
  },
  notifications: {
    systemAlerts: [
      {
        id: 'sys-1',
        title: 'RBI compliance update',
        description: 'New guideline for alternative data verification',
        time: '5m ago',
        severity: 'high',
      },
      {
        id: 'sys-2',
        title: 'Translation module standby',
        description: 'Tamil translations running in standby to save cost',
        time: '1h ago',
        severity: 'medium',
      },
    ],
    newApplications: [
      {
        id: 'app-1',
        title: 'Amit Kumar submitted documents',
        description: 'Awaiting officer validation',
        time: 'Just now',
        severity: 'info',
      },
      {
        id: 'app-2',
        title: 'Sunita Devi requested re-score',
        description: 'Auto-ingesting new recharge bills',
        time: '18m ago',
        severity: 'info',
      },
    ],
    performanceWarnings: [
      {
        id: 'perf-1',
        title: 'High-risk cluster drift',
        description: 'North Bihar cluster default probability +6%',
        time: '2h ago',
        severity: 'critical',
      },
    ],
  },
};

export const MOCK_BENEFICIARIES_LIST = [
  { id: 'ben_01', name: 'Aarav Sharma', region: 'Maharashtra', score: 786, risk: 'Low', income: 75000, loanStage: 'Approved', riskFactors: ['Consistent utility bill payments', 'Good income to loan ratio', 'Long credit history'] },
  { id: 'ben_02', name: 'Diya Patel', region: 'Gujarat', score: 650, risk: 'Medium', income: 45000, loanStage: 'Flagged', riskFactors: ['High credit utilization on existing loans', 'Recent job change', 'Limited savings history'] },
  { id: 'ben_03', name: 'Kiran Reddy', region: 'Andhra Pradesh', score: 520, risk: 'High', income: 25000, loanStage: 'Defaulted', riskFactors: ['History of late payments', 'Multiple recent credit inquiries', 'Low income compared to loan amount'] },
  { id: 'ben_04', name: 'Suresh Kumar', region: 'Uttar Pradesh', score: 710, risk: 'Low', income: 60000, loanStage: 'Approved', riskFactors: ['No previous defaults', 'Stable employment history', 'Low discretionary spending'] },
  { id: 'ben_05', name: 'Meena Kumari', region: 'Bihar', score: 680, risk: 'Medium', income: 35000, loanStage: 'Verification', riskFactors: ['Short credit history', 'Irregular income pattern from bill analysis', 'High loan amount requested'] },
  { id: 'ben_06', name: 'Rajesh Singh', region: 'Rajasthan', score: 810, risk: 'Low', income: 90000, loanStage: 'Approved', riskFactors: ['Excellent repayment history', 'Diversified sources of income', 'Low credit utilization'] },
  { id: 'ben_07', name: 'Anita Das', region: 'West Bengal', score: 590, risk: 'High', income: 30000, loanStage: 'Flagged', riskFactors: ['Missed payments on a previous loan', 'High essential expenses reducing disposable income', 'No utility bills provided'] },
  { id: 'ben_08', name: 'Vijay Iyer', region: 'Tamil Nadu', score: 750, risk: 'Low', income: 80000, loanStage: 'Approved', riskFactors: ['Long and positive credit history', 'Owns property', 'Consistent savings indicated by low essential spending'] },
];


export const MOCK_ADMIN_DATA = {
  stats: {
    totalBeneficiaries: '1.2M',
    activeLoans: '850K',
    averageScore: 712,
    regionalDefaultRate: '3.4%',
  },
  riskDistribution: [
    { name: 'Low Risk', value: 65, fill: 'hsl(var(--chart-2))' },
    { name: 'Medium Risk', value: 25, fill: 'hsl(var(--chart-3))' },
    { name: 'High Risk', value: 10, fill: 'hsl(var(--destructive))' },
  ],
  aiForecast: [
    { month: 'Aug', score: 715 },
    { month: 'Sep', score: 718 },
    { month: 'Oct', score: 721 },
    { month: 'Nov', score: 725 },
    { month: 'Dec', score: 728 },
    { month: 'Jan', score: 730 },
  ]
};

export const MOCK_NOTIFICATION_CENTER = {
  systemAlerts: [
    {
      id: 'sys-1',
      title: 'UDAAN compliance bulletin',
      description: 'Quarterly audit due for Aadhaar masking.',
      time: '5m ago',
      severity: 'critical',
    },
    {
      id: 'sys-2',
      title: 'Translation engine optimized',
      description: 'Tamil + Urdu modules shifted to standby.',
      time: '47m ago',
      severity: 'medium',
    },
  ],
  newApplications: [
    {
      id: 'app-1',
      title: 'Rajesh Kumar • Score 812',
      description: 'Waiting for officer approval',
      time: 'Just now',
      severity: 'info',
    },
    {
      id: 'app-2',
      title: 'Meena Kumari • Score 640',
      description: 'Verification escalation triggered',
      time: '12m ago',
      severity: 'warning',
    },
    {
      id: 'app-3',
      title: 'Aarav Sharma requested re-score',
      description: 'Utility bill ingested',
      time: '30m ago',
      severity: 'info',
    },
  ],
  performanceWarnings: [
    {
      id: 'perf-1',
      title: 'Cluster: Eastern Rural MSME',
      description: 'Default probability +4.3%',
      time: '1h ago',
      severity: 'critical',
    },
    {
      id: 'perf-2',
      title: 'Service level breach risk',
      description: 'Verification backlog > 200 cases',
      time: '3h ago',
      severity: 'warning',
    },
  ],
};

export const MOCK_DOCUMENT_VERIFICATIONS = [
  {
    id: 'doc-01',
    applicant: 'Aarav Sharma',
    type: 'Electricity Bill',
    number: 'MSEDCL-9283',
    uploadedAt: '25 Nov 2025 • 14:10 IST',
    channel: 'Mobile Upload',
    status: 'Valid',
    statusBadge: 'valid',
    metadata: [
      { label: 'Issuer', value: 'MSEDCL (Govt. of Maharashtra)' },
      { label: 'Billing Cycle', value: 'Oct 2025' },
      { label: 'Amount', value: '₹1,240' },
      { label: 'Consumer No.', value: '9827312331' },
      { label: 'Geo-tag', value: 'Nagpur, MH' },
    ],
    anomalies: [],
    previewHint: 'bill-preview-1',
  },
  {
    id: 'doc-02',
    applicant: 'Meena Kumari',
    type: 'Prepaid Recharge',
    number: 'JIO-44821',
    uploadedAt: '25 Nov 2025 • 12:42 IST',
    channel: 'WhatsApp Bot',
    status: 'Suspicious',
    statusBadge: 'suspicious',
    metadata: [
      { label: 'Operator', value: 'Jio' },
      { label: 'Recharge Value', value: '₹349' },
      { label: 'Txn ID', value: 'TXN990012' },
      { label: 'SIM Ownership', value: 'Meena Kumari' },
      { label: 'Geo-tag', value: 'Patna, BR' },
    ],
    anomalies: ['OCR mismatch on Txn ID', 'Potential image tampering detected'],
    previewHint: 'bill-preview-2',
  },
  {
    id: 'doc-03',
    applicant: 'Anita Das',
    type: 'Gas Cylinder Receipt',
    number: 'HP-73028',
    uploadedAt: '24 Nov 2025 • 19:25 IST',
    channel: 'Common Service Center',
    status: 'Forged',
    statusBadge: 'forged',
    metadata: [
      { label: 'Distributor', value: 'HP Gas' },
      { label: 'Booking ID', value: 'HP493020' },
      { label: 'Delivery Date', value: 'Pending' },
      { label: 'Geo-tag', value: 'Kolkata, WB' },
    ],
    anomalies: ['QR code does not resolve', 'Stamp reused from previous upload'],
    previewHint: 'bill-preview-3',
  },
];
