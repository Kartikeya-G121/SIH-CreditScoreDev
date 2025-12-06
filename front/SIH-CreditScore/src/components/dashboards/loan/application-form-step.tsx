'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, ArrowRight, IndianRupee, CheckCircle2 } from 'lucide-react';
import { schemeService } from '@/services/scheme-service';
import { loanApplicationService } from '@/services/loan-application-service';
import type { SchemeResponse } from '@/types/scheme-types';
import type { ApplicationFormData } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';

interface ApplicationFormStepProps {
    preSelectedSchemeId?: number;
    groupId?: number;
    onNext: (data: ApplicationFormData, applicationId: number) => void;
    initialData?: ApplicationFormData;
    isGroupLoan?: boolean;
    applicationId?: number;
}

const formSchema = z.object({
    schemeId: z.number({
        required_error: 'Please select a loan scheme',
    }),
    requestedAmount: z.number({
        required_error: 'Please enter the requested amount',
    }).positive('Amount must be greater than 0'),
    purpose: z.string().min(10, 'Please provide at least 10 characters describing the loan purpose'),
    tenureMonths: z.number().optional(),
});

export function ApplicationFormStep({ preSelectedSchemeId, groupId, onNext, initialData, isGroupLoan = false, applicationId }: ApplicationFormStepProps) {
    const { toast } = useToast();
    const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
    const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<SchemeResponse | null>(null);
    const [tenureMonths, setTenureMonths] = useState<number>(initialData?.tenureMonths || 12);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            schemeId: preSelectedSchemeId,
            requestedAmount: undefined,
            purpose: '',
            tenureMonths: 12,
        },
    });

    // Watch requested amount for real-time EMI calculation
    const watchedAmount = form.watch('requestedAmount');

    // Calculate EMI: P * R * (1+R)^N / ((1+R)^N - 1)
    const calculateEMI = (principal: number, ratePerAnnum: number, months: number): number => {
        if (!principal || principal <= 0) return 0;

        // Handle 0% interest rate
        if (ratePerAnnum === 0) {
            return Math.round(principal / months);
        }

        const monthlyRate = ratePerAnnum / 12 / 100;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

        return Math.round(emi);
    };

    // Fetch schemes
    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                setIsLoadingSchemes(true);
                const response = await schemeService.getActiveSchemes();
                const schemeList = Array.isArray(response) ? response : [];
                setSchemes(schemeList);

                // If pre-selected scheme or initial data has scheme, find and set it
                const targetSchemeId = preSelectedSchemeId || initialData?.schemeId;

                if (targetSchemeId) {
                    const scheme = schemeList.find(s => s.schemeId === targetSchemeId);
                    if (scheme) {
                        setSelectedScheme(scheme);
                        form.setValue('schemeId', targetSchemeId);

                        // Use initial tenure if available, otherwise default to min
                        const targetTenure = initialData?.tenureMonths || scheme.minTenureMonths;
                        setTenureMonths(targetTenure);
                        form.setValue('tenureMonths', targetTenure);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch schemes:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load loan schemes. Please try again.',
                });
            } finally {
                setIsLoadingSchemes(false);
            }
        };

        fetchSchemes();
    }, [preSelectedSchemeId, initialData, toast, form]);

    // Define categories based on admin options
    const categories = ['All', 'Agriculture', 'Business', 'Education', 'Personal', 'Housing'];

    // Filter schemes based on selected category
    // Filter schemes based on selected category and group loan eligibility
    const filteredSchemes = schemes.filter(s => {
        const matchesCategory = selectedCategory === 'All' || (s.loanCategory || 'Other') === selectedCategory;
        const matchesGroupLoan = isGroupLoan ? s.isGroupLoanAllowed : true;
        return matchesCategory && matchesGroupLoan;
    });

    // Update selected scheme when scheme ID changes
    // Update selected scheme when scheme ID changes
    const handleSchemeChange = (schemeId: string) => {
        const scheme = schemes.find(s => s.schemeId === parseInt(schemeId));
        setSelectedScheme(scheme || null);
        if (scheme) {
            // Only reset tenure if the current tenure is invalid for the new scheme
            // or if we are switching schemes (not loading initial data)
            // Actually, when loading initial data, this handler isn't called directly.
            // But if user changes scheme manually, we should reset to min.
            // However, the issue is likely that when the component mounts and sets the scheme from initialData,
            // it might be triggering something or the initial state isn't being set correctly.

            // Wait, the useEffect at line 79 handles initial load.
            // Let's check that logic.

            setTenureMonths(scheme.minTenureMonths);
            form.setValue('tenureMonths', scheme.minTenureMonths);
        }
        form.setValue('schemeId', parseInt(schemeId));
    };

    // Validate amount against scheme limits
    const validateAmount = (amount: number): boolean => {
        if (!selectedScheme) return true;

        if (amount < selectedScheme.minAmount) {
            form.setError('requestedAmount', {
                message: `Amount must be at least ₹${selectedScheme.minAmount.toLocaleString()}`,
            });
            return false;
        }

        if (amount > selectedScheme.maxAmount) {
            form.setError('requestedAmount', {
                message: `Amount cannot exceed ₹${selectedScheme.maxAmount.toLocaleString()}`,
            });
            return false;
        }

        return true;
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // Validate amount against scheme limits
        if (!validateAmount(values.requestedAmount)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const draftRequest = {
                schemeId: values.schemeId,
                requestedAmount: values.requestedAmount,
                purpose: values.purpose,
                tenureMonths: tenureMonths,
                groupId: groupId,
            };

            let responseAppId = applicationId;

            if (applicationId) {
                // Update existing draft
                const response = await loanApplicationService.updateDraftApplication(applicationId, draftRequest);
                responseAppId = response.applicationId;

                toast({
                    title: 'Draft Updated',
                    description: 'Your application draft has been updated.',
                });
            } else {
                // Create new draft
                const response = await loanApplicationService.createDraftApplication(draftRequest);
                responseAppId = response.applicationId;

                toast({
                    title: 'Draft Saved',
                    description: 'Your application has been saved as a draft.',
                });
            }

            // Move to next step
            const formData: ApplicationFormData = {
                schemeId: values.schemeId,
                requestedAmount: values.requestedAmount,
                purpose: values.purpose,
                tenureMonths: tenureMonths,
                groupId: groupId,
            };

            onNext(formData, responseAppId);
        } catch (error) {
            console.error('Failed to create draft application:', error);
            toast({
                variant: 'destructive',
                title: 'Application Failed',
                description: error instanceof Error ? error.message : 'Failed to save application draft. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Loan Application Details</CardTitle>
                <CardDescription>
                    Please provide the details of your loan application. This will be saved as a draft.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Scheme Selection */}
                        <FormField
                            control={form.control}
                            name="schemeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loan Scheme *</FormLabel>

                                    {/* Category Filter */}
                                    <div className="mb-4">
                                        <label className="text-sm font-medium mb-1.5 block">Filter by Category</label>
                                        <Select
                                            value={selectedCategory}
                                            onValueChange={setSelectedCategory}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Select
                                        onValueChange={handleSchemeChange}
                                        defaultValue={field.value?.toString()}
                                        disabled={!!preSelectedSchemeId || isLoadingSchemes}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoadingSchemes ? 'Loading schemes...' : 'Select a loan scheme'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredSchemes.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    No schemes found for this category
                                                </div>
                                            ) : (
                                                filteredSchemes.map((scheme) => (
                                                    <SelectItem key={scheme.schemeId} value={scheme.schemeId.toString()}>
                                                        {scheme.schemeName} - {scheme.providerName}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {preSelectedSchemeId ? 'Scheme pre-selected from your previous choice' : 'Choose the loan scheme that best fits your needs'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Scheme Details Display */}
                        {selectedScheme && (
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                                <h4 className="font-semibold text-sm">Scheme Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Category</p>
                                        <p className="font-medium">{selectedScheme.loanCategory || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Interest Rate</p>
                                        <p className="font-medium">{selectedScheme.baseInterestRate}% p.a.</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Tenure Range</p>
                                        <p className="font-medium">{selectedScheme.minTenureMonths} - {selectedScheme.maxTenureMonths} months</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Min Amount</p>
                                        <p className="font-medium flex items-center">
                                            <IndianRupee className="h-3 w-3 mr-1" />
                                            {selectedScheme.minAmount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Max Amount</p>
                                        <p className="font-medium flex items-center">
                                            <IndianRupee className="h-3 w-3 mr-1" />
                                            {selectedScheme.maxAmount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* EMI Calculator */}
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold text-sm mb-4">EMI Calculator</h4>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <label className="text-muted-foreground">Loan Tenure</label>
                                                <span className="font-medium">{tenureMonths} months</span>
                                            </div>
                                            <Slider
                                                value={[tenureMonths]}
                                                min={selectedScheme.minTenureMonths}
                                                max={selectedScheme.maxTenureMonths}
                                                step={1}
                                                onValueChange={(value) => {
                                                    setTenureMonths(value[0]);
                                                    form.setValue('tenureMonths', value[0]);
                                                }}
                                                className="py-2"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{selectedScheme.minTenureMonths} months</span>
                                                <span>{selectedScheme.maxTenureMonths} months</span>
                                            </div>
                                        </div>

                                        <div className="bg-primary/5 rounded-lg p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Estimated Monthly Installment</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Based on {selectedScheme.baseInterestRate}% interest for {tenureMonths} months
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary flex items-center justify-end">
                                                    <IndianRupee className="h-5 w-5 mr-1" />
                                                    {calculateEMI(watchedAmount || 0, selectedScheme.baseInterestRate, tenureMonths).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">approx.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Requested Amount */}
                        <FormField
                            control={form.control}
                            name="requestedAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Requested Loan Amount *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                placeholder="Enter amount"
                                                className="pl-10"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    field.onChange(isNaN(val) ? undefined : val);
                                                }}
                                                onBlur={(e) => {
                                                    field.onBlur();
                                                    const value = parseFloat(e.target.value);
                                                    if (value) {
                                                        validateAmount(value);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        {selectedScheme
                                            ? `Enter an amount between ₹${selectedScheme.minAmount.toLocaleString()} and ₹${selectedScheme.maxAmount.toLocaleString()}`
                                            : 'Select a scheme to see amount limits'
                                        }
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Loan Purpose */}
                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loan Purpose *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe how you plan to use this loan (e.g., business expansion, equipment purchase, working capital)"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Provide a clear description of how you intend to use the loan funds
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Group ID Display (if applicable) */}
                        {groupId && (
                            <div className="rounded-lg border bg-blue-50 p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Group Loan Application</strong> - This application is for group ID: {groupId}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting || isLoadingSchemes}
                                className="min-w-[150px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : isGroupLoan ? (
                                    <>
                                        Save Draft
                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
