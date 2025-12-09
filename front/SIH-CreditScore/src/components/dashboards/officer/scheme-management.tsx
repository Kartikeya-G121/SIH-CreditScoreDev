import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { schemeService, Scheme } from '@/services/scheme-service';
import { Loader2, Plus, Pencil, Trash2, Power, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SchemeManagement() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
    const [saving, setSaving] = useState(false);

    // Filters
    const [filterProvider, setFilterProvider] = useState('');
    const [filterGroupAllowed, setFilterGroupAllowed] = useState('All');
    const [filterMinAmount, setFilterMinAmount] = useState<number | ''>('');
    const [filterMaxAmount, setFilterMaxAmount] = useState<number | ''>('');
    const [filterMaxInterest, setFilterMaxInterest] = useState<number | ''>('');
    const [filterMinTenure, setFilterMinTenure] = useState<number | ''>('');
    const [filterMaxTenure, setFilterMaxTenure] = useState<number | ''>('');

    // Form State
    const [formData, setFormData] = useState<Partial<Scheme>>({
        schemeName: '',
        providerName: '',
        loanCategory: 'Personal',
        minAmount: 0,
        maxAmount: 0,
        baseInterestRate: 0,
        minTenureMonths: 0,
        maxTenureMonths: 0,
        isTieredInterest: false,
        tierThreshold: 0,
        tierInterestRate: 0,
        // Eligibility
        minAge: 18,
        maxAge: 65,
        genderAllowed: 'All',
        casteCategory: 'All',
        incomeMax: 0,
        maxExistingLoans: 1,
        // Terms
        isSubsidy: false,
        subsidyType: 'None',
        subsidyPercentage: 0,
        gracePeriodDays: 0,
        penaltyRate: 0,
        emiBounceCharges: 0,
        allowPrepayment: true,
        prepaymentPenalty: 0,
        isGroupLoanAllowed: false,
    });

    useEffect(() => {
        fetchSchemes();
    }, []);

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            const data = await schemeService.getAllSchemes();
            setSchemes(data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch schemes.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof Scheme, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            if (editingScheme) {
                await schemeService.updateScheme(editingScheme.schemeId, formData);
                toast({ title: 'Success', description: 'Scheme updated successfully.' });
            } else {
                await schemeService.createScheme(formData);
                toast({ title: 'Success', description: 'Scheme created successfully.' });
            }
            setIsDialogOpen(false);
            fetchSchemes();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save scheme.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (scheme: Scheme) => {
        setEditingScheme(scheme);
        setFormData(scheme);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingScheme(null);
        setFormData({
            schemeName: '',
            providerName: '',
            loanCategory: 'Personal',
            minAmount: 10000,
            maxAmount: 500000,
            baseInterestRate: 10,
            minTenureMonths: 12,
            maxTenureMonths: 60,
            isTieredInterest: false,
            tierThreshold: 0,
            tierInterestRate: 0,
            minAge: 18,
            maxAge: 65,
            genderAllowed: 'All',
            casteCategory: 'All',
            incomeMax: 300000,
            maxExistingLoans: 1,
            isSubsidy: false,
            subsidyType: 'None',
            subsidyPercentage: 0,
            gracePeriodDays: 30,
            penaltyRate: 2,
            emiBounceCharges: 0,
            allowPrepayment: true,
            prepaymentPenalty: 0,
            isGroupLoanAllowed: false,
        });
        setIsDialogOpen(true);
    };

    const handleToggle = async (id: number) => {
        try {
            await schemeService.toggleScheme(id);
            fetchSchemes();
            toast({ title: 'Success', description: 'Scheme status updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle scheme.' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this scheme?')) return;
        try {
            await schemeService.deleteScheme(id);
            fetchSchemes();
            toast({ title: 'Success', description: 'Scheme deleted successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete scheme.' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Loan Schemes</h2>
                    <p className="text-muted-foreground">Manage loan schemes, eligibility, and terms.</p>
                </div>
                {/* Only Admins/Officers can create schemes */}
                {user?.role === 'officer' && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Scheme
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-muted/40 p-4 rounded-lg flex-wrap">
                <div className="w-full max-w-xs space-y-1">
                    <Label className="text-xs text-muted-foreground">Provider Name</Label>
                    <Input
                        placeholder="Filter by provider..."
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="h-9 bg-background"
                    />
                </div>
                <div className="w-full max-w-xs space-y-1">
                    <Label className="text-xs text-muted-foreground">Group Loans</Label>
                    <Select value={filterGroupAllowed} onValueChange={setFilterGroupAllowed}>
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="Yes">Allowed</SelectItem>
                            <SelectItem value="No">Not Allowed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Filters Popover */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-6 h-9">
                            Advanced Filters
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Advanced Filters</DialogTitle>
                            <DialogDescription>
                                Refine your search with amount, interest, and tenure ranges.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Amount</Label>
                                    <Input
                                        type="number"
                                        value={filterMinAmount}
                                        onChange={(e) => setFilterMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Min ₹"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Amount</Label>
                                    <Input
                                        type="number"
                                        value={filterMaxAmount}
                                        onChange={(e) => setFilterMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Max ₹"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Interest Rate (%)</Label>
                                <Input
                                    type="number"
                                    value={filterMaxInterest}
                                    onChange={(e) => setFilterMaxInterest(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Up to %"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Tenure (Months)</Label>
                                    <Input
                                        type="number"
                                        value={filterMinTenure}
                                        onChange={(e) => setFilterMinTenure(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Min months"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Tenure (Months)</Label>
                                    <Input
                                        type="number"
                                        value={filterMaxTenure}
                                        onChange={(e) => setFilterMaxTenure(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Max months"
                                    />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Button
                    variant="ghost"
                    onClick={() => {
                        setFilterProvider('');
                        setFilterGroupAllowed('All');
                        setFilterMinAmount('');
                        setFilterMaxAmount('');
                        setFilterMaxInterest('');
                        setFilterMinTenure('');
                        setFilterMaxTenure('');
                    }}
                    className="mt-6 h-9"
                    disabled={!filterProvider && filterGroupAllowed === 'All' && !filterMinAmount && !filterMaxAmount && !filterMaxInterest && !filterMinTenure && !filterMaxTenure}
                >
                    Reset
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {schemes.filter(scheme => {
                        const matchProvider = scheme.providerName?.toLowerCase().includes(filterProvider.toLowerCase()) || false;
                        const matchGroup = filterGroupAllowed === 'All'
                            ? true
                            : filterGroupAllowed === 'Yes'
                                ? scheme.isGroupLoanAllowed
                                : !scheme.isGroupLoanAllowed;

                        // Advanced Filters Logic
                        // Amount Range: Check if scheme's range overlaps with filter range (partially or fully) or fits criteria
                        // Here, typically user wants schemes that support their desired amount.
                        // So if user wants 50000 (MinAmount filter), scheme must support >= 50000? 
                        // Or is the filter filtering schemes based on their properties?
                        // Let's assume standard property filtering:
                        // Scheme Min >= Filter Min (or just standard numeric comparison)
                        // Actually, for "Min Amount", user probably wants schemes that start at least at X.
                        // For simplicity, let's filter schemes whose *configured* min/max fall within bounds or meet threshold.

                        // Logic:
                        // If FilterMinAmount is set: Only show schemes where scheme.maxAmount >= FilterMinAmount (i.e. capable of giving that much)
                        // This seems most logical for a borrower. But this is an Officer Dashboard.
                        // Officer probably wants to find "Schemes where Min Amount is >= X".
                        // Let's implement direct property filtering.

                        const matchMinAmount = filterMinAmount === '' || scheme.minAmount >= filterMinAmount;
                        const matchMaxAmount = filterMaxAmount === '' || scheme.maxAmount <= filterMaxAmount;

                        const matchInterest = filterMaxInterest === '' || scheme.baseInterestRate <= filterMaxInterest;

                        const matchMinTenure = filterMinTenure === '' || scheme.minTenureMonths >= filterMinTenure;
                        const matchMaxTenure = filterMaxTenure === '' || scheme.maxTenureMonths <= filterMaxTenure;

                        return matchProvider && matchGroup && matchMinAmount && matchMaxAmount && matchInterest && matchMinTenure && matchMaxTenure;
                    }).map((scheme) => (
                        <Card key={scheme.schemeId} className="relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${scheme.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{scheme.schemeName}</CardTitle>
                                        <CardDescription>{scheme.providerName}</CardDescription>
                                    </div>
                                    <Badge variant={scheme.isActive ? 'default' : 'secondary'}>
                                        {scheme.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Interest Rate:</span>
                                        <span className="font-medium">{scheme.baseInterestRate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-medium">₹{scheme.minAmount} - ₹{scheme.maxAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tenure:</span>
                                        <span className="font-medium">{scheme.minTenureMonths} - {scheme.maxTenureMonths} months</span>
                                    </div>
                                    {scheme.isGroupLoanAllowed && (
                                        <div className="flex items-center text-blue-600 mt-2">
                                            <Info className="h-4 w-4 mr-1" /> Group Loan Allowed
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => handleToggle(scheme.schemeId)}>
                                        <Power className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(scheme)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(scheme.schemeId)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingScheme ? 'Edit Scheme' : 'Create New Scheme'}</DialogTitle>
                        <DialogDescription>Configure scheme details, eligibility, and terms.</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                                <TabsTrigger value="terms">Terms & Subsidy</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Scheme Name</Label>
                                        <Input
                                            value={formData.schemeName}
                                            onChange={(e) => handleInputChange('schemeName', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Provider Name</Label>
                                        <Input
                                            value={formData.providerName}
                                            onChange={(e) => handleInputChange('providerName', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Loan Category</Label>
                                        <Select
                                            value={formData.loanCategory}
                                            onValueChange={(val) => handleInputChange('loanCategory', val)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Personal">Personal</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Education">Education</SelectItem>
                                                <SelectItem value="Housing">Housing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Base Interest Rate (%)</Label>
                                        <Input
                                            type="number"
                                            value={formData.baseInterestRate}
                                            onChange={(e) => handleInputChange('baseInterestRate', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Min Amount</Label>
                                        <Input
                                            type="number"
                                            value={formData.minAmount}
                                            onChange={(e) => handleInputChange('minAmount', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Amount</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxAmount}
                                            onChange={(e) => handleInputChange('maxAmount', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Min Tenure (Months)</Label>
                                        <Input
                                            type="number"
                                            value={formData.minTenureMonths}
                                            onChange={(e) => handleInputChange('minTenureMonths', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Tenure (Months)</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxTenureMonths}
                                            onChange={(e) => handleInputChange('maxTenureMonths', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 border p-4 rounded-md">
                                    <Switch
                                        checked={formData.isGroupLoanAllowed}
                                        onCheckedChange={(checked) => handleInputChange('isGroupLoanAllowed', checked)}
                                    />
                                    <Label>Allow Group Loans</Label>
                                </div>
                            </TabsContent>

                            <TabsContent value="eligibility" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Min Age</Label>
                                        <Input
                                            type="number"
                                            value={formData.minAge}
                                            onChange={(e) => handleInputChange('minAge', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Age</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxAge}
                                            onChange={(e) => handleInputChange('maxAge', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender Allowed</Label>
                                        <Select
                                            value={formData.genderAllowed}
                                            onValueChange={(val) => handleInputChange('genderAllowed', val)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Caste Category</Label>
                                        <Select
                                            value={formData.casteCategory}
                                            onValueChange={(val) => handleInputChange('casteCategory', val)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="OBC">OBC</SelectItem>
                                                <SelectItem value="SC">SC</SelectItem>
                                                <SelectItem value="ST">ST</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Income (Annual)</Label>
                                        <Input
                                            type="number"
                                            value={formData.incomeMax}
                                            onChange={(e) => handleInputChange('incomeMax', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Existing Loans</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxExistingLoans}
                                            onChange={(e) => handleInputChange('maxExistingLoans', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="terms" className="space-y-4 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.isSubsidy}
                                            onCheckedChange={(checked) => handleInputChange('isSubsidy', checked)}
                                        />
                                        <Label>Is Subsidy Available?</Label>
                                    </div>

                                    {formData.isSubsidy && (
                                        <div className="grid grid-cols-2 gap-4 pl-6 border-l-2">
                                            <div className="space-y-2">
                                                <Label>Subsidy Type</Label>
                                                <Select
                                                    value={formData.subsidyType}
                                                    onValueChange={(val) => handleInputChange('subsidyType', val)}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="Interest">Interest</SelectItem>
                                                        <SelectItem value="Capital">Capital</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Subsidy Percentage</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.subsidyPercentage}
                                                    onChange={(e) => handleInputChange('subsidyPercentage', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label>Grace Period (Days)</Label>
                                            <Input
                                                type="number"
                                                value={formData.gracePeriodDays}
                                                onChange={(e) => handleInputChange('gracePeriodDays', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Penalty Rate (%)</Label>
                                            <Input
                                                type="number"
                                                value={formData.penaltyRate}
                                                onChange={(e) => handleInputChange('penaltyRate', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>EMI Bounce Charges</Label>
                                            <Input
                                                type="number"
                                                value={formData.emiBounceCharges}
                                                onChange={(e) => handleInputChange('emiBounceCharges', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Prepayment Penalty (%)</Label>
                                            <Input
                                                type="number"
                                                value={formData.prepaymentPenalty}
                                                onChange={(e) => handleInputChange('prepaymentPenalty', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 mt-4">
                                        <Switch
                                            checked={formData.allowPrepayment}
                                            onCheckedChange={(checked) => handleInputChange('allowPrepayment', checked)}
                                        />
                                        <Label>Allow Prepayment</Label>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingScheme ? 'Update Scheme' : 'Create Scheme'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
