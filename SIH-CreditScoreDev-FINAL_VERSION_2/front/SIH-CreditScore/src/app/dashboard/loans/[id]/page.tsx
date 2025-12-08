'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LoanDetailView } from '@/components/dashboards/loan/servicing/loan-detail-view';

export default function LoanDetailPage() {
    const params = useParams();
    const loanId = Number(params.id);

    if (!loanId || isNaN(loanId)) {
        return <div className="p-8">Invalid Loan ID</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            <LoanDetailView loanId={loanId} />
        </div>
    );
}
