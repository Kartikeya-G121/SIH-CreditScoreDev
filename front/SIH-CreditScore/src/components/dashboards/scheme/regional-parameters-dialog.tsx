'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { schemeService } from '@/services/scheme-service';
import { RegionResponse } from '@/types/scheme-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const regionSchema = z.object({
    regionName: z.string().min(2, 'Region name must be at least 2 characters'),
    riskFactor: z.coerce.number().min(0, 'Risk factor must be positive'),
    baseInterestAdjustment: z.coerce.number(),
    maxLoanAmountAdjustment: z.coerce.number(),
});

type RegionFormValues = z.infer<typeof regionSchema>;

interface RegionalParametersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RegionalParametersDialog({ open, onOpenChange }: RegionalParametersDialogProps) {
    const { toast } = useToast();
    const [regions, setRegions] = useState<RegionResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState<RegionResponse | null>(null);

    const form = useForm<RegionFormValues>({
        resolver: zodResolver(regionSchema),
        defaultValues: {
            regionName: '',
            riskFactor: 1.0,
            baseInterestAdjustment: 0,
            maxLoanAmountAdjustment: 0,
        },
    });

    const fetchRegions = async () => {
        try {
            setIsLoading(true);
            const data = await schemeService.getRegionalParameters();
            setRegions(data.regions || []);
        } catch (error) {
            console.error('Failed to fetch regions:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load regional parameters.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchRegions();
        }
    }, [open]);

    const onSubmit = async (data: RegionFormValues) => {
        try {
            setIsLoading(true);
            if (isEditing) {
                await schemeService.updateRegionalParameter(isEditing.id, data);
                toast({ title: 'Success', description: 'Region updated successfully' });
            } else {
                await schemeService.addRegionalParameter(data);
                toast({ title: 'Success', description: 'Region added successfully' });
            }
            form.reset({
                regionName: '',
                riskFactor: 1.0,
                baseInterestAdjustment: 0,
                maxLoanAmountAdjustment: 0,
            });
            setIsEditing(null);
            fetchRegions();
        } catch (error) {
            console.error('Failed to save region:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save regional parameter.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (region: RegionResponse) => {
        setIsEditing(region);
        form.reset({
            regionName: region.regionName,
            riskFactor: region.riskFactor,
            baseInterestAdjustment: region.baseInterestAdjustment,
            maxLoanAmountAdjustment: region.maxLoanAmountAdjustment,
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        form.reset({
            regionName: '',
            riskFactor: 1.0,
            baseInterestAdjustment: 0,
            maxLoanAmountAdjustment: 0,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Regional Parameters</DialogTitle>
                    <DialogDescription>
                        Manage risk factors and adjustments for different regions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Region Name</TableHead>
                                    <TableHead>Risk Factor</TableHead>
                                    <TableHead>Interest Adj.</TableHead>
                                    <TableHead>Loan Amt Adj.</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {regions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No regions defined.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    regions.map((region) => (
                                        <TableRow key={region.id}>
                                            <TableCell className="font-medium">{region.regionName}</TableCell>
                                            <TableCell>{region.riskFactor}</TableCell>
                                            <TableCell>{region.baseInterestAdjustment > 0 ? '+' : ''}{region.baseInterestAdjustment}%</TableCell>
                                            <TableCell>{region.maxLoanAmountAdjustment > 0 ? '+' : ''}{region.maxLoanAmountAdjustment}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(region)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-4">{isEditing ? 'Edit Region' : 'Add New Region'}</h4>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="regionName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Region Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. North Zone" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="riskFactor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Risk Factor</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="baseInterestAdjustment"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Interest Adjustment (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maxLoanAmountAdjustment"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loan Amount Adj.</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="1000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    {isEditing && (
                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditing ? 'Update Region' : 'Add Region'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
