import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { TransactionTimeline } from '@/components/dashboards/loan/servicing/transaction-timeline';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { LoanTransaction } from '@/types/loan-servicing-types';
import { toast } from '@/hooks/use-toast';

export function TransactionsExplorer() {
    const [loanId, setLoanId] = useState('');
    const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!loanId) return;
        setLoading(true);
        setSearched(true);
        try {
            const data = await loanServicingApi.getTransactions(Number(loanId));
            setTransactions(data);
        } catch (error) {
            console.error("Search failed", error);
            setTransactions([]);
            toast({
                variant: "destructive",
                title: "Not Found",
                description: `Could not find transactions for Loan ID: ${loanId}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transactions Explorer</CardTitle>
                <CardDescription>Search for transactions by Loan ID.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 max-w-md">
                    <Input
                        placeholder="Enter Loan ID..."
                        value={loanId}
                        onChange={(e) => setLoanId(e.target.value)}
                        type="number"
                    />
                    <Button onClick={handleSearch} disabled={loading || !loanId}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2">Search</span>
                    </Button>
                </div>

                {searched && (
                    <div className="border rounded-md p-4">
                        {transactions.length > 0 ? (
                            <TransactionTimeline transactions={transactions} />
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No transactions found for this Loan ID.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
