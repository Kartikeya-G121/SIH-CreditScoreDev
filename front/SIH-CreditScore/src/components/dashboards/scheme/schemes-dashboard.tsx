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

    const isAdmin = user?.role === 'officer';

    const fetchSchemes = async () => {
        try {
            setIsLoading(true);
            const data = isAdmin
                ? await schemeService.getAllSchemes()
                : await schemeService.getActiveSchemes();
            setSchemes(data.schemes || []);
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
                    ) : schemes.length > 0 ? (
                        <SchemeList
                            schemes={schemes}
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
