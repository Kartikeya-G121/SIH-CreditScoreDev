'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { schemeService } from '@/services/scheme-service';
import { SchemeResponse } from '@/types/scheme-types';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Landmark, Settings } from 'lucide-react';
import { SchemeList } from './scheme-list';
import { SchemeDetailsDialog } from './scheme-details-dialog';
import { CreateSchemeDialog } from './create-scheme-dialog';
import { RegionalParametersDialog } from './regional-parameters-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export function SchemesDashboard() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isRegionalDialogOpen, setIsRegionalDialogOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<SchemeResponse | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [schemeToDelete, setSchemeToDelete] = useState<SchemeResponse | null>(null);

    // Filter State
    const [filters, setFilters] = useState({
        providerName: '',
        loanCategory: 'ALL',
        amount: '',
        tenure: '',
        interestRate: '',
    });

    const isAdmin = user?.role === 'LOAN_OFFICER' || user?.role === 'ADMIN';

    const fetchSchemes = async () => {
        try {
            setIsLoading(true);
            const data = isAdmin
                ? await schemeService.getAllSchemes()
                : await schemeService.getActiveSchemes();
            setSchemes(Array.isArray(data) ? data : data.schemes || []);
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load schemes.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes();
    }, [isAdmin]);

    // Client-side filtering logic
    const filteredSchemes = schemes.filter(scheme => {
        const matchesProvider = !filters.providerName || scheme.providerName.toLowerCase().includes(filters.providerName.toLowerCase());
        const matchesCategory = filters.loanCategory === 'ALL' || (scheme.loanCategory && scheme.loanCategory.toUpperCase() === filters.loanCategory);
        const matchesAmount = !filters.amount || (scheme.minAmount <= Number(filters.amount) && scheme.maxAmount >= Number(filters.amount));
        const matchesTenure = !filters.tenure || (scheme.minTenureMonths <= Number(filters.tenure) && scheme.maxTenureMonths >= Number(filters.tenure));
        const matchesInterest = !filters.interestRate || scheme.baseInterestRate <= Number(filters.interestRate);

        return matchesProvider && matchesCategory && matchesAmount && matchesTenure && matchesInterest;
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            providerName: '',
            loanCategory: 'ALL',
            amount: '',
            tenure: '',
            interestRate: '',
        });
    };

    const handleViewDetails = (scheme: SchemeResponse) => {
        setSelectedScheme(scheme);
        setIsDetailsOpen(true);
    };

    const handleApplyNow = (scheme: SchemeResponse) => {
        // Navigate to apply-loan page with scheme pre-selected
        router.push(`/dashboard?tab=apply-loan&scheme=${scheme.schemeId}`);
    };

    const handleToggleStatus = async (scheme: SchemeResponse) => {
        try {
            await schemeService.toggleScheme(scheme.schemeId);
            toast({ title: 'Success', description: 'Scheme status updated.' });
            fetchSchemes();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
        }
    };

    const handleDeleteClick = (scheme: SchemeResponse) => {
        setSchemeToDelete(scheme);
    };

    const confirmDelete = async () => {
        if (!schemeToDelete) return;
        try {
            await schemeService.deleteScheme(schemeToDelete.schemeId);
            toast({ title: 'Success', description: 'Scheme deleted successfully.' });
            fetchSchemes();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete scheme.' });
        } finally {
            setSchemeToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Loan Schemes</h2>
                    <p className="text-muted-foreground">
                        Explore available loan products and financial schemes.
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsRegionalDialogOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Regional Params
                        </Button>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Scheme
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="provider"
                                placeholder="Search provider..."
                                className="pl-8"
                                value={filters.providerName}
                                onChange={(e) => handleFilterChange('providerName', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={filters.loanCategory}
                            onValueChange={(value) => handleFilterChange('loanCategory', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                <SelectItem value="AGRICULTURE">Agriculture</SelectItem>
                                <SelectItem value="EDUCATION">Education</SelectItem>
                                <SelectItem value="BUSINESS">Business</SelectItem>
                                <SelectItem value="HOUSING">Housing</SelectItem>
                                <SelectItem value="PERSONAL">Personal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Required amount"
                            value={filters.amount}
                            onChange={(e) => handleFilterChange('amount', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tenure">Tenure (Months)</Label>
                        <Input
                            id="tenure"
                            type="number"
                            placeholder="Desired tenure"
                            value={filters.tenure}
                            onChange={(e) => handleFilterChange('tenure', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 flex items-end">
                        <Button variant="ghost" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Schemes</TabsTrigger>
                    {!isAdmin && <TabsTrigger value="recommended">Recommended for You</TabsTrigger>}
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredSchemes.length > 0 ? (
                        <SchemeList
                            schemes={filteredSchemes}
                            onViewDetails={handleViewDetails}
                            isAdmin={isAdmin}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDeleteClick}
                            onApplyNow={handleApplyNow}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                <Landmark className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No schemes found</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                                There are currently no active loan schemes available.
                            </p>
                        </div>
                    )}
                </TabsContent>

                {!isAdmin && (
                    <TabsContent value="recommended">
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <p className="text-muted-foreground">AI-powered recommendations coming soon.</p>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <CreateSchemeDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={fetchSchemes}
            />

            <SchemeDetailsDialog
                scheme={selectedScheme}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                isAdmin={isAdmin}
            />

            <RegionalParametersDialog
                open={isRegionalDialogOpen}
                onOpenChange={setIsRegionalDialogOpen}
            />

            <AlertDialog open={!!schemeToDelete} onOpenChange={(open) => !open && setSchemeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the scheme
                            "{schemeToDelete?.schemeName}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
