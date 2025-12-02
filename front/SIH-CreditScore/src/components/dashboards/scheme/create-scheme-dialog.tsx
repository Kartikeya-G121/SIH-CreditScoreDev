'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { schemeService } from '@/services/scheme-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
    schemeName: z.string().min(3, 'Name must be at least 3 characters'),
    providerName: z.string().min(2, 'Provider name is required'),
    loanCategory: z.string().min(1, 'Category is required'),
    minAmount: z.coerce.number().min(1000, 'Minimum amount must be at least 1000'),
    maxAmount: z.coerce.number().min(1000, 'Maximum amount must be at least 1000'),
    baseInterestRate: z.coerce.number().min(0).max(100),
    minTenureMonths: z.coerce.number().min(1),
    maxTenureMonths: z.coerce.number().min(1),
    isTieredInterest: z.boolean().default(false),
    tierThreshold: z.coerce.number().optional(),
    tierInterestRate: z.coerce.number().optional(),
}).refine((data) => data.maxAmount >= data.minAmount, {
    message: "Max amount must be greater than or equal to min amount",
    path: ["maxAmount"],
}).refine((data) => data.maxTenureMonths >= data.minTenureMonths, {
    message: "Max tenure must be greater than or equal to min tenure",
    path: ["maxTenureMonths"],
});

interface CreateSchemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateSchemeDialog({ open, onOpenChange, onSuccess }: CreateSchemeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            schemeName: '',
            providerName: '',
            loanCategory: '',
            minAmount: 10000,
            maxAmount: 50000,
            baseInterestRate: 8.5,
            minTenureMonths: 6,
            maxTenureMonths: 24,
            isTieredInterest: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            await schemeService.createScheme(values);

            toast({
                title: 'Success',
                description: 'Scheme created successfully.',
            });

            form.reset();
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to create scheme:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create scheme. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Loan Scheme</DialogTitle>
                    <DialogDescription>
                        Define a new loan product available for beneficiaries.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="schemeName"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Scheme Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Rural Entrepreneur Loan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="providerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provider Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., SBI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="loanCategory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Agriculture">Agriculture</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Education">Education</SelectItem>
                                                <SelectItem value="Personal">Personal</SelectItem>
                                                <SelectItem value="Housing">Housing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="baseInterestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interest Rate (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minTenureMonths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Tenure (m)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxTenureMonths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Tenure (m)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isTieredInterest"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Enable Tiered Interest Rates
                                        </FormLabel>
                                        <FormDescription>
                                            Higher interest rates for amounts exceeding a threshold.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {form.watch('isTieredInterest') && (
                            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                                <FormField
                                    control={form.control}
                                    name="tierThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Threshold Amount (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tierInterestRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tiered Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Scheme
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
