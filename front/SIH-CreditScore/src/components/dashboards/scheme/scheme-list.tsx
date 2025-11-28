'use client';

import { SchemeResponse } from '@/types/scheme-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, Percent, CalendarClock, IndianRupee } from 'lucide-react';

interface SchemeListProps {
    schemes: SchemeResponse[];
    onViewDetails: (scheme: SchemeResponse) => void;
    isAdmin?: boolean;
    onToggleStatus?: (scheme: SchemeResponse) => void;
    onEdit?: (scheme: SchemeResponse) => void;
}

export function SchemeList({ schemes, onViewDetails, isAdmin, onToggleStatus, onEdit }: SchemeListProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme) => (
                <Card key={scheme.schemeId} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl line-clamp-1" title={scheme.schemeName}>
                                {scheme.schemeName}
                            </CardTitle>
                            {isAdmin && (
                                <Badge variant={scheme.isActive ? 'default' : 'secondary'}>
                                    {scheme.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="flex items-center gap-1">
                            <Landmark className="h-3 w-3" />
                            {scheme.providerName}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Percent className="mr-1 h-3 w-3" />
                                    Interest Rate
                                </div>
                                <p className="font-medium">{scheme.baseInterestRate}%</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <CalendarClock className="mr-1 h-3 w-3" />
                                    Tenure
                                </div>
                                <p className="font-medium">{scheme.minTenureMonths} - {scheme.maxTenureMonths} m</p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <IndianRupee className="mr-1 h-3 w-3" />
                                    Loan Amount
                                </div>
                                <p className="font-medium">
                                    ₹{scheme.minAmount.toLocaleString()} - ₹{scheme.maxAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{scheme.loanCategory}</Badge>
                            {scheme.isTieredInterest && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    Tiered Rates
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => onViewDetails(scheme)}>
                            View Details
                        </Button>
                        {isAdmin && onEdit && (
                            <Button variant="ghost" size="icon" onClick={() => onEdit(scheme)}>
                                <span className="sr-only">Edit</span>
                                ✏️
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
