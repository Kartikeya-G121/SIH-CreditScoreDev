import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ProviderPerformanceStats } from "@/services/loan-portfolio-service";

interface ProviderPerformanceTableProps {
    data: ProviderPerformanceStats[];
}

export function ProviderPerformanceTable({ data = [] }: ProviderPerformanceTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="col-span-4 mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">Provider Intelligence</CardTitle>
                    <CardDescription>
                        Performance metrics by Scheme Provider (Schemes, AUM, Risk)
                    </CardDescription>
                </div>
                {/* Optional: Add specific actions for this section here */}
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[200px]">Provider Name</TableHead>
                                <TableHead className="text-center">Total Schemes</TableHead>
                                <TableHead className="text-center">Active Loans</TableHead>
                                <TableHead className="text-right">Total AUM</TableHead>
                                <TableHead className="text-right">Total Disbursed</TableHead>
                                <TableHead className="text-right">Avg ROI</TableHead>
                                <TableHead className="text-right">NPA Rate</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data && data.length > 0 ? (
                                data.map((provider) => (
                                    <TableRow key={provider.providerName} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {provider.providerName}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-slate-100">
                                                {provider.totalSchemes}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {provider.activeLoans}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(provider.totalAum)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(provider.totalDisbursed)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {provider.averageRoi.toFixed(2)}%
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={provider.npaRate > 5 ? "destructive" : (provider.npaRate > 2 ? "secondary" : "outline")}
                                                className={provider.npaRate <= 2 ? "bg-green-50 text-green-700 border-green-200" : ""}
                                            >
                                                {provider.npaRate.toFixed(2)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No provider data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
