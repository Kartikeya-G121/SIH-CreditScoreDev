'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { authService } from '@/services/auth-service';
import { useLanguage } from '@/contexts/language-context';

const formSchema = z.object({
    otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

export function VerifyOtpForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState<{ type: 'email' | 'phone', value: string } | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { t } = useLanguage();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            otp: '',
        },
    });

    useEffect(() => {
        const emailFromUrl = searchParams.get('email');
        const phoneFromUrl = searchParams.get('phone');
        const emailFromStorage = localStorage.getItem('pending-registration-email');
        const phoneFromStorage = localStorage.getItem('pending-registration-phone');

        if (emailFromUrl) {
            setIdentifier({ type: 'email', value: emailFromUrl });
        } else if (phoneFromUrl) {
            setIdentifier({ type: 'phone', value: phoneFromUrl });
        } else if (emailFromStorage) {
            setIdentifier({ type: 'email', value: emailFromStorage });
        } else if (phoneFromStorage) {
            setIdentifier({ type: 'phone', value: phoneFromStorage });
        }
    }, [searchParams]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        try {
            if (!identifier) {
                toast({
                    variant: 'destructive',
                    title: 'Session Expired',
                    description: 'Could not find registration details. Please register again.',
                });
                return;
            }

            const requestData = {
                otp: values.otp,
                email: identifier.type === 'email' ? identifier.value : undefined,
                phoneNumber: identifier.type === 'phone' ? identifier.value : undefined,
            };

            await authService.verifyOtp(requestData);

            toast({
                title: t('otp_verified'),
                description: "Your account has been activated.",
            });

            // Clear storage
            localStorage.removeItem('pending-registration-email');
            localStorage.removeItem('pending-registration-phone');

            router.push('/login');
        } catch (err: any) {
            console.error("OTP verification failed:", err);
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: err.message || t('otp_invalid'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendOtp = async () => {
        if (!identifier) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Missing contact details to resend OTP.',
            });
            return;
        }

        try {
            await authService.resendOtp(identifier.value);

            toast({
                title: t('otp_sent'),
                description: "A new OTP has been sent to your device.",
            });
        } catch (err: any) {
            console.error("Resend OTP failed:", err);
            toast({
                variant: 'destructive',
                title: 'Failed to Resend',
                description: err.message || 'Could not resend OTP. Please try again.',
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('otp_label')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('otp_placeholder')} {...field} maxLength={6} className="text-center text-lg tracking-widest" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    {t('verify_button')}
                </Button>

                <div className="text-center">
                    <Button variant="link" type="button" onClick={handleResendOtp} className="text-sm text-muted-foreground">
                        {t('resend_otp')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
