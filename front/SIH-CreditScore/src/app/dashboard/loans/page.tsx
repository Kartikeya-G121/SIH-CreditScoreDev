'use client';

import { LoanList } from "@/components/dashboards/loan/loan-list";
import { useRouter } from "next/navigation";

export default function LoansPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-8">
            <LoanList
                onPayNow={(loan) => router.push(`/dashboard/loans/${loan.loanId}`)}
                onViewDetails={(loan) => router.push(`/dashboard/loans/${loan.loanId}`)}
            />
        </div>
    );
}
