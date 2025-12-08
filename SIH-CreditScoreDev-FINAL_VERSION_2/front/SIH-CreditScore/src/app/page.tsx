
'use client';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BarChart,
  CheckCircle,
  Database,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Logo } from '@/components/layout/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/contexts/language-context';
import Autoplay from 'embla-carousel-autoplay';

function LandingHeader() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Logo />
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="#features"
            className="transition-colors hover:text-primary"
          >
            {t('features')}
          </Link>
          <Link href="#partners" className="transition-colors hover:text-primary">
            {t('partners')}
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-primary"
          >
            {t('dashboard')}
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              {t('register')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { t } = useLanguage();
  /* const partners = PlaceHolderImages.filter((img) =>
    img.id.startsWith('partner-')
  ); */

  const partners = [
    {
      imageUrl: "/images/partners/partner-1.png",
      description: "Partner Institution 1",
      imageHint: "trusted bank partner"
    },
    {
      imageUrl: "/images/partners/partner-2.png",
      description: "Partner Institution 2",
      imageHint: "financial organization"
    },
    {
      imageUrl: "/images/partners/partner-3.png",
      description: "Partner Institution 3",
      imageHint: "lending partner"
    },
    {
      imageUrl: "/images/partners/partner-4.png",
      description: "Partner Institution 4",
      imageHint: "strategic collaborator"
    }
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="landing-gradient text-white">
          <div className="container grid grid-cols-1 items-center gap-8 py-20 md:grid-cols-2 lg:py-32">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl lg:text-6xl">
                UDAAN! AI-Driven Credit Scoring
              </h1>
              <p className="mx-auto max-w-[700px] text-lg text-gray-200 md:mx-0">
                Empowering genuine low-income beneficiaries with transparent, AI-powered credit assessment for direct digital lending
              </p>
              <div className="space-x-4">
                <Button size="lg" asChild variant="secondary">
                  <Link href="/register">
                    {t('get_started')} <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/image.png"
                alt="Credit Score Dashboard"
                width={600}
                height={400}
                className="mx-auto overflow-hidden rounded-xl object-cover"
                data-ai-hint="financial empowerment"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="w-full bg-muted py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                UDAAN! Core Features
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dual ML pipelines with explainable AI for transparent, fair credit decisions
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Card className="transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-bold">
                    Dual ML Pipelines
                  </CardTitle>
                  <BarChart className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Risk Assessment + Income Classification using alternative data sources like utility bills and mobile usage
                  </p>
                </CardContent>
              </Card>
              <Card className="transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-bold">
                    Explainable AI
                  </CardTitle>
                  <CheckCircle className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    K-Means consensus with LIME/SHAP for transparent, auditable decisions every beneficiary can understand
                  </p>
                </CardContent>
              </Card>
              <Card className="transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-bold">
                    Composite Scoring
                  </CardTitle>
                  <Database className="h-8 w-8 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Weighted fusion of risk and income scores into Priority/Normal/Conditional lending categories
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Partners Section */}
        <section id="partners" className="py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                Trusted by India&apos;s Leading Institutions
              </h2>
              <p className="mt-4 text-muted-foreground">
                We collaborate with key organizations to drive financial
                inclusion across the nation.
              </p>
            </div>
            <Carousel
              plugins={[Autoplay({ delay: 2000 })]}
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {partners.map((partner, index) => (
                  <CarouselItem
                    key={index}
                    className="md:basis-1/3 lg:basis-1/4"
                  >
                    <div className="p-1">
                      <Card className="h-32">
                        <CardContent className="flex h-full items-center justify-center p-6">
                          <div className="relative h-16 w-full">
                            <Image
                              src={partner.imageUrl}
                              alt={partner.description}
                              fill
                              className="object-contain"
                              data-ai-hint={partner.imageHint}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>

        {/* Start Partner Onboarding CTA */}
        <section className="border-t bg-slate-50 py-12 dark:bg-slate-900/50">
          <div className="container flex flex-col items-center gap-4 text-center">
            <h3 className="font-headline text-2xl font-bold">
              Become a Partner
            </h3>
            <p className="max-w-[600px] text-muted-foreground">
              Join our network of financial institutions and help us drive financial inclusion across India.
            </p>
            <Button size="lg" variant="outline" asChild className="mt-2">
              <Link href="/partner-onboard">
                Partner Registration <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        {/* End Partner Onboarding CTA */}

        {/* CTA Section */}
        <section className="bg-muted">
          <div className="container flex flex-col items-center justify-between gap-6 py-24 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight">
                Ready to take control of your financial future?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Join thousands of others empowering their lives with fair and
                transparent credit.
              </p>
            </div>
            <Button size="lg" asChild className="flex-shrink-0">
              <Link href="/register">
                Register Now <CheckCircle className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex h-16 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} UDAAN! Team BMS/SIH2025/07. Smart India Hackathon 2025.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
