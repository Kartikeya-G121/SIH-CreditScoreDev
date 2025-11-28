'use client';

import { VerifyOtpForm } from '@/components/auth/verify-otp-form';
import { Logo } from '@/components/layout/logo';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

export default function VerifyOtpPage() {
    const { t } = useLanguage();

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t('verify_otp_title')}</CardTitle>
                    <CardDescription>
                        {t('verify_otp_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VerifyOtpForm />
                </CardContent>
            </Card>
        </div>
    );
}
