import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from '@/components/layout/logo';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/layout/language-toggle';

export default function ResetPasswordPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(31,61,122,0.7),_transparent),radial-gradient(circle_at_bottom,_rgba(28,166,118,0.6),_transparent)]" />
            <div className="relative z-10 flex min-h-screen flex-col">
                <header className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                                Government Digital Trust
                            </p>
                            <p className="font-semibold">UDAAN Identity Gateway</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/10 text-white">
                            AA Accessibility
                        </Badge>
                        <LanguageToggle />
                    </div>
                </header>

                <div className="flex flex-1 items-center justify-center px-6 py-8">
                    <Card className="w-full max-w-md border-white/10 bg-white">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                                <div className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
                                    Security Check
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-900">
                                Reset Password
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Create a new password for your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<div>Loading...</div>}>
                                <ResetPasswordForm />
                            </Suspense>
                            <div className="mt-4 text-center text-sm text-slate-500">
                                <Link href="/login" className="text-primary underline">
                                    Back to Login
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
