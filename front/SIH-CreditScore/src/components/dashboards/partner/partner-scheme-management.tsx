'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { schemeService } from '@/services/scheme-service';
import { useToast } from '@/hooks/use-toast';

interface Scheme {
    schemeId: number;
    schemeName: string;
    providerName: string;
    loanCategory: string;
    minAmount: number;
    maxAmount: number;
    baseInterestRate: number;
    minTenureMonths: number;
    maxTenureMonths: number;
    isActive: boolean;
    minAge?: number;
    maxAge?: number;
    genderAllowed?: string;
}

export default function PartnerSchemeManagement() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newScheme, setNewScheme] = useState<Partial<Scheme>>({
        schemeName: '',
        loanCategory: 'Personal',
        minAmount: 10000,
        maxAmount: 500000,
        baseInterestRate: 10.5,
        minTenureMonths: 12,
        maxTenureMonths: 60,
        minAge: 18,
        maxAge: 65,
        genderAllowed: 'All'
    });

    useEffect(() => {
        fetchSchemes();
    }, [user]); // Re-fetch if user changes, to handle role-based filtering

    const fetchSchemes = async () => {
        try {
            setLoading(true);
            // For Partner, this should return only their schemes if backend filtering is working
            const data = await schemeService.getAllSchemes();
            setSchemes(data);
        } catch (error) {
            console.error('Error fetching schemes:', error);
            toast({ title: 'Error', description: 'Failed to load schemes', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScheme = async () => {
        try {
            if (!newScheme.schemeName) {
                toast({ title: 'Error', description: 'Scheme name is required', variant: 'destructive' });
                return;
            }

            await schemeService.createScheme(newScheme);
            toast({ title: 'Success', description: 'Scheme created successfully' });
            setIsCreateDialogOpen(false);
            fetchSchemes();

            // Reset form
            setNewScheme({
                schemeName: '',
                loanCategory: 'Personal',
                minAmount: 10000,
                maxAmount: 500000,
                baseInterestRate: 10.5,
                minTenureMonths: 12,
                maxTenureMonths: 60,
                minAge: 18,
                maxAge: 65,
                genderAllowed: 'All'
            });
        } catch (error) {
            console.error('Error creating scheme:', error);
            console.error('Error creating scheme:', error);
            toast({ title: 'Error', description: 'Failed to create scheme', variant: 'destructive' });
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await schemeService.toggleScheme(id);
            toast({ title: 'Success', description: `Scheme ${currentStatus ? 'deactivated' : 'activated'}` });
            fetchSchemes();
        } catch (error) {
            console.error('Error toggling status:', error);
            console.error('Error toggling status:', error);
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    const handleDeleteScheme = async (id: number) => {
        if (!confirm('Are you sure you want to delete this scheme?')) return;

        try {
            await schemeService.deleteScheme(id);
            await schemeService.deleteScheme(id);
            toast({ title: 'Success', description: 'Scheme deleted' });
            fetchSchemes();
        } catch (error) {
            console.error('Error deleting scheme:', error);
            console.error('Error deleting scheme:', error);
            toast({ title: 'Error', description: 'Failed to delete scheme', variant: 'destructive' });
        }
    };

    const filteredSchemes = schemes.filter(scheme =>
        scheme.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.loanCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Schemes</h2>
                    <p className="text-muted-foreground">Manage your loan products and offerings.</p>
                </div>

                {/* CREATE SCHEME BUTTON - Visible for Partners */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Create New Scheme
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Loan Scheme</DialogTitle>
                            <DialogDescription>
                                Define the parameters for your new loan product.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="schemeName">Scheme Name</Label>
                                <Input
                                    id="schemeName"
                                    placeholder="e.g. Rural Micro-Enterprise Loan"
                                    value={newScheme.schemeName}
                                    onChange={(e) => setNewScheme({ ...newScheme, schemeName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={newScheme.loanCategory}
                                    onChange={(e) => setNewScheme({ ...newScheme, loanCategory: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="interest">Base Interest Rate (%)</Label>
                                <Input
                                    id="interest"
                                    type="number"
                                    step="0.1"
                                    value={newScheme.baseInterestRate}
                                    onChange={(e) => setNewScheme({ ...newScheme, baseInterestRate: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minAmount">Min Amount (₹)</Label>
                                <Input
                                    id="minAmount"
                                    type="number"
                                    value={newScheme.minAmount}
                                    onChange={(e) => setNewScheme({ ...newScheme, minAmount: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                                <Input
                                    id="maxAmount"
                                    type="number"
                                    value={newScheme.maxAmount}
                                    onChange={(e) => setNewScheme({ ...newScheme, maxAmount: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minTenure">Min Tenure (Months)</Label>
                                <Input
                                    id="minTenure"
                                    type="number"
                                    value={newScheme.minTenureMonths}
                                    onChange={(e) => setNewScheme({ ...newScheme, minTenureMonths: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxTenure">Max Tenure (Months)</Label>
                                <Input
                                    id="maxTenure"
                                    type="number"
                                    value={newScheme.maxTenureMonths}
                                    onChange={(e) => setNewScheme({ ...newScheme, maxTenureMonths: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Age Criteria</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        value={newScheme.minAge}
                                        onChange={(e) => setNewScheme({ ...newScheme, minAge: parseInt(e.target.value) })}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        value={newScheme.maxAge}
                                        onChange={(e) => setNewScheme({ ...newScheme, maxAge: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateScheme}>Create Scheme</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search schemes..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchemes.map((scheme) => (
                    <Card key={scheme.schemeId} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant={scheme.isActive ? "default" : "secondary"} className={scheme.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                    {scheme.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleToggleStatus(scheme.schemeId, scheme.isActive)}
                                        >
                                            {scheme.isActive ? (
                                                <><XCircle className="mr-2 h-4 w-4 text-orange-500" /> Deactivate</>
                                            ) : (
                                                <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Activate</>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleDeleteScheme(scheme.schemeId)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">{scheme.schemeName}</CardTitle>
                            <CardDescription>{scheme.loanCategory} • {scheme.providerName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Interest Rate</span>
                                    <span className="font-semibold">{scheme.baseInterestRate}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Loan Amount</span>
                                    <span className="font-medium">₹{scheme.minAmount.toLocaleString()} - ₹{scheme.maxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tenure</span>
                                    <span className="font-medium">{scheme.minTenureMonths} - {scheme.maxTenureMonths} Months</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
