
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Briefcase, CheckCircle } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { partnerService, PartnerRequestDTO } from '@/services/partner-service';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
    contactPersonName: z.string().min(2, { message: 'Contact person name is required.' }),
    gmailForLogin: z.string().email({ message: 'Valid Gmail is required for login.' }),
    officialOrganizationEmail: z.string().email({ message: 'Valid organization email is required.' }),
    mobile: z.string().optional(),
    note: z.string().optional(),
});

export default function PartnerOnboardPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contactPersonName: '',
            gmailForLogin: '',
            officialOrganizationEmail: '',
            mobile: '',
            note: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await partnerService.createOnboardingRequest(values);
            setIsSuccess(true);
            toast({
                title: 'Request Submitted',
                description: 'Your partnership request has been submitted successfully. We will contact you soon.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error.message || 'Something went wrong.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="container flex items-center justify-center min-h-screen py-10">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl">Request Received!</CardTitle>
                        <CardDescription>
                            Thank you for your interest in partnering with us. Your request has been forwarded to our admin team for review. You will receive an email at <strong>{form.getValues('officialOrganizationEmail')}</strong> once approved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container flex items-center justify-center min-h-screen py-10 bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">Partner Onboarding</h2>
                    </div>
                    <CardDescription>
                        Join our network as a Channel Partner. Fill out the details below to request access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="contactPersonName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gmailForLogin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gmail for Login</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="partner.login@gmail.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="officialOrganizationEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Official Organization Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contact@organization.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+91..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Additional Note (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Tell us about your organization..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
