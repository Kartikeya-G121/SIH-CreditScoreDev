'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

// Types
interface Loan {
  loanId: number;
  totalPrincipal: number;
  totalInterest: number;
  monthlyEmi: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  startDate: string;
  endDate: string;
  loanStatus: string;
  nextPaymentDate: string;
  interestRate: number;
  remainingTenure: number;
}

interface RepaymentSchedule {
  installmentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingPrincipal: number;
  status: 'PAID' | 'UPCOMING' | 'OVERDUE';
}

export default function LoanDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<RepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [adjustmentMode, setAdjustmentMode] = useState('TENURE_REDUCTION');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLoan) {
      fetchSchedule(selectedLoan.loanId);
    }
  }, [selectedLoan]);

  const fetchLoans = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data);
        if (data.data.length > 0) setSelectedLoan(data.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch loans", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (loanId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/loans/${loanId}/projected-schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    }
  };

  const handlePayment = async () => {
    if (!selectedLoan || !payAmount) return;
    setIsPaying(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/loans/${selectedLoan.loanId}/repay`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          mode: 'ONLINE',
          adjustmentMode: adjustmentMode,
          transactionRef: `TXN-${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Payment Successful", description: "Your repayment has been recorded." });
        setPayAmount('');
        fetchLoans(); // Refresh loan details
        fetchSchedule(selectedLoan.loanId); // Refresh schedule
      } else {
        toast({ variant: "destructive", title: "Payment Failed", description: data.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process payment" });
    } finally {
      setIsPaying(false);
    }
  };

  const handleForeclose = async () => {
    if (!selectedLoan) return;
    if (!confirm("Are you sure you want to foreclose this loan? This will pay off the entire outstanding amount.")) return;
    
    setIsPaying(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/loans/${selectedLoan.loanId}/foreclose`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Loan Foreclosed", description: "Your loan has been successfully closed." });
        fetchLoans();
      } else {
        toast({ variant: "destructive", title: "Foreclosure Failed", description: data.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to foreclose loan" });
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">My Loans</h2>
      </div>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You have no active loans.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Loan List / Selector */}
          <div className="md:col-span-4 space-y-4">
            {loans.map(loan => (
              <Card 
                key={loan.loanId} 
                className={`cursor-pointer transition-all hover:shadow-md ${selectedLoan?.loanId === loan.loanId ? 'border-primary ring-1 ring-primary' : ''}`}
                onClick={() => setSelectedLoan(loan)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Loan #{loan.loanId}</CardTitle>
                    <Badge variant={loan.loanStatus === 'ACTIVE' ? 'default' : 'secondary'}>{loan.loanStatus}</Badge>
                  </div>
                  <CardDescription>Sanctioned: {format(new Date(loan.startDate), 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-semibold">₹{loan.outstandingPrincipal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next EMI</span>
                      <span className="font-semibold">₹{loan.monthlyEmi.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loan Details & Actions */}
          <div className="md:col-span-8 space-y-6">
            {selectedLoan && (
              <>
                {/* Key Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Principal</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{selectedLoan.outstandingPrincipal.toLocaleString()}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly EMI</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{selectedLoan.monthlyEmi.toLocaleString()}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Remaining Tenure</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{selectedLoan.remainingTenure} Months</div></CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="flex-1 bg-green-600 hover:bg-green-700">Pay EMI / Prepay</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make Repayment</DialogTitle>
                        <DialogDescription>Pay your EMI or make a prepayment to reduce interest.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Payment Amount (₹)</Label>
                          <Input 
                            type="number" 
                            value={payAmount} 
                            onChange={(e) => setPayAmount(e.target.value)} 
                            placeholder={`Min EMI: ${selectedLoan.monthlyEmi}`}
                          />
                        </div>
                        {parseFloat(payAmount) > selectedLoan.monthlyEmi && (
                          <div className="space-y-2">
                            <Label>Adjustment Mode</Label>
                            <Select value={adjustmentMode} onValueChange={setAdjustmentMode}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TENURE_REDUCTION">Reduce Tenure (Pay off earlier)</SelectItem>
                                <SelectItem value="EMI_REDUCTION">Reduce EMI (Lower monthly payments)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {adjustmentMode === 'TENURE_REDUCTION' 
                                ? "Your monthly EMI will remain the same, but the loan will end sooner."
                                : "Your loan tenure will remain the same, but your future monthly EMIs will decrease."}
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePayment} disabled={isPaying}>
                          {isPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="lg" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={handleForeclose}>
                    Foreclose Loan
                  </Button>
                </div>

                {/* Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle>Repayment Schedule</CardTitle>
                    <CardDescription>Projected timeline of your payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">#</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>EMI</TableHead>
                            <TableHead>Principal</TableHead>
                            <TableHead>Interest</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schedule.map((row) => (
                            <TableRow key={row.installmentNumber}>
                              <TableCell>{row.installmentNumber}</TableCell>
                              <TableCell>{format(new Date(row.dueDate), 'MMM d, yyyy')}</TableCell>
                              <TableCell>₹{row.emiAmount.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground">₹{row.principalComponent.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground">₹{row.interestComponent.toLocaleString()}</TableCell>
                              <TableCell>₹{row.outstandingPrincipal.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={row.status === 'PAID' ? 'default' : 'outline'} className={row.status === 'PAID' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                  {row.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
