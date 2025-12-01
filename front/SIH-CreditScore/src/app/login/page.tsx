
'use client';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/layout/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/layout/language-toggle';

export default function LoginPage() {
  const { t } = useLanguage();
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
            <LanguageToggle variant="outline" showLabel />
          </div>
        </header>

        <div className="grid flex-1 gap-8 px-6 py-8 lg:grid-cols-2 lg:px-12">
          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-[0.5em] text-white/60">
              Bharat Stack x FinTech
            </p>
            <h1 className="mt-4 text-4xl font-bold lg:text-5xl">
              Secure Smart Login for Beneficiary Credit Scoring
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              Aadhaar-linked, multilingual, and bias-free identity verification for
              UDAAN. Designed for officers and beneficiaries who expect trust,
              speed, and transparency.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {['Aadhaar + OTP', 'Multilingual UI', 'Govt Seal Verification', 'Dark site ready'].map(
                (item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p>{item}</p>
                  </div>
                )
              )}
            </div>
          </div>

          <Card className="relative border-white/10 bg-white">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                <div className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Digital Seva
                </div>
                <div className="text-xs text-slate-500">Zero Bias · Verified Access</div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {t('welcome_back')}
              </CardTitle>
              <CardDescription className="text-slate-500">
                Smart login with OTP + multilingual assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-4 text-center text-sm text-slate-500">
                {t('no_account')}{' '}
                <Link href="/register" className="text-primary underline">
                  {t('sign_up')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
