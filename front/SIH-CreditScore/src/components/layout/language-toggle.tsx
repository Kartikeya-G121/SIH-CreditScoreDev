'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

export function LanguageToggle() {
    const { setLanguage } = useLanguage();
    const { toast } = useToast();

    const handleLanguageChange = (lang: 'en' | 'hi' | 'bn' | 'ta') => {
        if (lang === 'en' || lang === 'hi') {
            setLanguage(lang);
            toast({
                title: 'Language Switched',
                description: `Language has been set to ${lang === 'en' ? 'English' : 'Hindi'}.`,
            });
        } else {
            toast({
                title: 'Language Not Available',
                description: 'This language is not yet supported in the prototype.',
                variant: 'destructive',
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleLanguageChange('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleLanguageChange('hi')}>
                    हिंदी
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleLanguageChange('bn')}>
                    বাংলা
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleLanguageChange('ta')}>
                    தமிழ்
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
