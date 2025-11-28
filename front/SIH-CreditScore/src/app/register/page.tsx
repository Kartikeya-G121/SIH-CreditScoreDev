
'use client';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/layout/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">{t('create_account')}</CardTitle>
          <CardDescription>
            {t('create_account_prompt')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="mt-4 text-center text-sm">
            {t('already_have_account')}{' '}
            <Link href="/login" className="underline">
              {t('log_in')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
