import { IndianRupee } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
    >
      <div className="rounded-lg bg-primary p-2">
        <IndianRupee className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-headline text-lg font-bold">
        AI Credit Assist
      </span>
    </Link>
  );
}
