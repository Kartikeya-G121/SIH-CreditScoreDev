import React from 'react';
import { LoanTransaction } from '@/types/loan-servicing-types';
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Banknote,
    CalendarClock,
    Wallet,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface TransactionTimelineProps {
    transactions: LoanTransaction[];
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

export function TransactionTimeline({ transactions }: TransactionTimelineProps) {
    if (!transactions || transactions.length === 0) {
        return <div className="p-4 text-center text-gray-500">No transactions found.</div>;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'DISBURSEMENT': return <Wallet className="h-4 w-4 text-blue-500" />;
            case 'EMI_PAYMENT': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'PREPAYMENT': return <Banknote className="h-4 w-4 text-purple-500" />;
            case 'PENALTY_CHARGE': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'FORECLOSURE_PAYMENT': return <CheckCircle2 className="h-4 w-4 text-green-700" />;
            default: return <CalendarClock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <div className="space-y-8 pl-2">
                {transactions.map((txn) => (
                    <div key={txn.transactionId} className="relative flex gap-4 pb-4 border-l border-gray-200 last:border-0 pl-6 last:pb-0">
                        <span className="absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-gray-100">
                            {getIcon(txn.txnType)}
                        </span>
                        <div className="flex flex-1 flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                    {txn.txnType.replace(/_/g, ' ')}
                                </p>
                                <span className="text-xs text-gray-500">
                                    {format(new Date(txn.valueDate), 'dd MMM yyyy')}
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="text-lg font-bold text-gray-900">
                                    {formatMoney(txn.amount)}
                                </p>
                                {txn.paymentMode && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                                        {txn.paymentMode}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                {txn.principalComponent > 0 && <p>Principal: {formatMoney(txn.principalComponent)}</p>}
                                {txn.interestComponent > 0 && <p>Interest: {formatMoney(txn.interestComponent)}</p>}
                                {txn.penaltyComponent > 0 && <p className="text-red-600">Penalty: {formatMoney(txn.penaltyComponent)}</p>}
                                {txn.chargesComponent > 0 && <p>Charges: {formatMoney(txn.chargesComponent)}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
