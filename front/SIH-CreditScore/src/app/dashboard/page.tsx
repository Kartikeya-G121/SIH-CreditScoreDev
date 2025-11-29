
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/layout/logo';
import BeneficiaryDashboard from '@/components/dashboards/beneficiary-dashboard';
import OfficerDashboard from '@/components/dashboards/officer-dashboard';
import CreditAssessment from '@/components/credit-scoring/credit-assessment';

import NotificationsCenter from '@/components/dashboards/notifications-center';
import ScoreExplainability from '@/components/dashboards/score-explainability';
import { GroupDashboard } from '@/components/dashboards/group/group-dashboard';
import { SchemesDashboard } from '@/components/dashboards/scheme/schemes-dashboard';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Lightbulb,
  UploadCloud,
  BellRing,
  Brain,
  ShieldAlert,
  Landmark,
} from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FloatingChatbotButton } from '@/components/chatbot/floating-chatbot-button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/language-context';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { MOCK_NOTIFICATION_CENTER } from '@/lib/data';

function DashboardSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const activeTab = searchParams.get('tab') || (user?.role === 'beneficiary' ? 'overview' : 'dashboard');

  const handleNav = (href: string) => {
    if (href.startsWith('#')) {
      const tab = href.substring(1);
      router.push(`/dashboard?tab=${tab}`);
    } else {
      toast({ title: `Navigating to ${href.substring(1)}` });
      // In a real app, you would use: router.push(href);
    }
  };

  const navItems = {
    beneficiary: [
      {
        id: 'overview',
        icon: <LayoutDashboard />,
        label: t('sidebar_overview'),
      },
      {
        id: 'repayments',
        icon: <BarChart3 />,
        label: t('sidebar_repayments'),
      },
      {
        id: 'profile',
        icon: <Users />,
        label: t('sidebar_profile'),
      },
      {
        id: 'advice',
        icon: <Lightbulb />,
        label: t('sidebar_financial_advice'),
      },
      {
        id: 'bill-upload',
        icon: <UploadCloud />,
        label: t('sidebar_bill_upload'),
      },
      {
        id: 'credit-score',
        icon: <BarChart3 />,
        label: 'UDAAN Score',
      },
      {
        id: 'xai',
        icon: <Brain />,
        label: t('sidebar_xai'),
      },

      {
        id: 'group-lending',
        icon: <Users />,
        label: t('sidebar_group_lending'),
      },
      {
        id: 'schemes',
        icon: <Landmark />,
        label: 'Loan Schemes',
      },
      {
        id: 'notifications',
        icon: <BellRing />,
        label: t('sidebar_notifications'),
      },
    ],
    officer: [
      {
        id: 'dashboard',
        icon: <LayoutDashboard />,
        label: t('sidebar_dashboard'),
      },
      {
        id: 'risk-monitoring',
        icon: <ShieldAlert />,
        label: 'Risk Monitoring',
      },
      {
        id: 'schemes',
        icon: <Landmark />,
        label: 'Loan Schemes',
      },
      {
        id: 'notifications',
        icon: <BellRing />,
        label: t('sidebar_notifications'),
      },
    ],
  };

  const currentNavItems = user ? navItems[user.role] : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {currentNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleNav(`#${item.id}`)}
                isActive={activeTab === item.id}
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNav('/help')}>
              <HelpCircle />
              <span>{t('sidebar_help')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNav('/settings')}>
              <Settings />
              <span>{t('sidebar_settings')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-2" />
        {user && (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">{t(user.role)}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <h1 className="text-xl font-semibold">
        {user ? `Welcome, ${user.name}` : 'Dashboard'}
      </h1>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <UserNav />
      </div>
    </header>
  );
}


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || (user?.role === 'beneficiary' ? 'overview' : 'dashboard');


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'beneficiary':
        if (tab === 'credit-score') {
          return <CreditAssessment beneficiaryId={user.id || 'BEN001'} />;
        }

        if (tab === 'notifications') {
          return <NotificationsCenter />;
        }
        if (tab === 'xai') {
          return <ScoreExplainability />;
        }
        if (tab === 'notifications') {
          return <NotificationsCenter />;
        }
        if (tab === 'group-lending') {
          return <GroupDashboard />;
        }
        if (tab === 'schemes') {
          return <SchemesDashboard />;
        }
        return <BeneficiaryDashboard activeTab={tab} />;
      case 'officer':
        if (tab === 'notifications') {
          return <NotificationsCenter />;
        }
        if (tab === 'schemes') {
          return <SchemesDashboard />;
        }
        return <OfficerDashboard activeTab={tab} />;
      default:
        return <div>Invalid Role. Please contact support.</div>;
    }
  };

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderDashboard()}
        </main>
      </SidebarInset>
      <FloatingChatbotButton />
    </SidebarProvider>
  );
}
