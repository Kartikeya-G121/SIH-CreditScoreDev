import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RepaymentSchedule } from '@/types/loan-servicing-types';

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

interface EmiScheduleTableProps {
    schedule: RepaymentSchedule[];
    onPay?: (installment: RepaymentSchedule) => void;
}

export function EmiScheduleTable({ schedule, onPay }: EmiScheduleTableProps) {
    // Filter logic:
    // 1. Show all UPCOMING/PENDING/DUE/OVERDUE.
    // 2. Show COMPLETED only if they are real EMIs (emiAmount > 0). 
    //    (Filter out "ghost" rows created by prepayments/bugs which have 0 total due but non-zero components - relying on emiAmount check)
    const activeSchedule = schedule.filter(s => {
        if (s.status === 'COMPLETED') {
            return s.emiAmount > 0;
        }
        return true;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
            case 'DUE': return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100';
        }
    };

    // Find the first pending/due/overdue installment to enforce sequential payment
    const nextInstallmentIndex = schedule.findIndex(s => ['PENDING', 'DUE', 'OVERDUE'].includes(s.status));

    const isPayable = (item: RepaymentSchedule) => {
        if (item.status === 'COMPLETED') return false;
        // Enforce sequential: Only the global next installment is payable
        return item.installmentNumber === schedule[nextInstallmentIndex]?.installmentNumber;
    };

    if (activeSchedule.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <p>No schedule available.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border overflow-hidden shadow-sm bg-white">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Repayment Schedule</h3>
                <span className="text-xs text-muted-foreground">{activeSchedule.length} Payments</span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="w-[80px]">#</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total Due</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Principal</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Interest</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activeSchedule.map((item, index) => {
                        const payable = isPayable(item);
                        const isPaid = item.status === 'COMPLETED';

                        return (
                            <TableRow key={item.installmentNumber} className={payable ? "bg-blue-50/30" : isPaid ? "bg-gray-50/50 opacity-75" : ""}>
                                <TableCell className="font-medium text-gray-500">{item.installmentNumber}</TableCell>
                                <TableCell className="font-medium">
                                    {format(new Date(item.dueDate), 'dd MMM yyyy')}
                                    {item.status === 'OVERDUE' && (
                                        <span className="block text-[10px] text-red-500 font-bold">Overdue</span>
                                    )}
                                    {isPaid && item.paidDate && (
                                        <span className="block text-[10px] text-green-600">Paid: {format(new Date(item.paidDate), 'dd/MM')}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-900">
                                    {formatMoney(item.emiAmount + item.penaltyComponent)}
                                    {item.penaltyComponent > 0 && (
                                        <span className="block text-[10px] text-red-600 font-normal mt-0.5">
                                            (incl. ₹{item.penaltyComponent.toLocaleString()} penalty)
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-gray-500 hidden md:table-cell">
                                    {formatMoney(item.principalComponent)}
                                </TableCell>
                                <TableCell className="text-right text-gray-500 hidden md:table-cell">
                                    {formatMoney(item.interestComponent)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-sm px-2 py-0.5 ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payable ? (
                                        <Button
                                            size="sm"
                                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                            onClick={() => onPay?.(item)}
                                        >
                                            Pay Now
                                        </Button>
                                    ) : isPaid ? (
                                        <span className="text-xs font-semibold text-green-600 flex items-center justify-end gap-1">
                                            ✓ Paid
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Locked</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
