'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { scoringService, FlaskModelInfo, FlaskHealthStatus } from '@/services/scoring-service';
import {
    Activity,
    CheckCircle,
    RefreshCw,
    Server,
    AlertCircle,
    Wifi,
    WifiOff,
    ArrowRightLeft
} from 'lucide-react';
import CustomTrainingSection from './custom-training-section';

export default function MLModelsManagement() {
    const { toast } = useToast();
    const [flaskInfo, setFlaskInfo] = useState<FlaskModelInfo | null>(null);
    const [health, setHealth] = useState<FlaskHealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [switchingRisk, setSwitchingRisk] = useState(false);
    const [switchingIncome, setSwitchingIncome] = useState(false);

    const fetchFlaskData = async () => {
        try {
            setLoading(true);

            // Fetch health and info separately to handle individual failures
            const healthPromise = scoringService.checkFlaskHealth().catch(err => {
                console.error('Health check failed:', err);
                return { risk_api: false, income_api: false };
            });

            const infoPromise = scoringService.getFlaskModelInfo().catch(err => {
                console.error('Model info fetch failed:', err);
                return null;
            });

            const [healthStatus, info] = await Promise.all([healthPromise, infoPromise]);

            setHealth(healthStatus);
            setFlaskInfo(info);

            // Only show error if both APIs are completely down
            if (!healthStatus.risk_api && !healthStatus.income_api && !info) {
                toast({
                    title: 'Warning',
                    description: 'ML services are offline. Make sure Flask APIs are running.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlaskData();
        // No auto-refresh - manual refresh only
    }, []);

    const handleSwitchRiskVersion = async (version: 'v1' | 'v2') => {
        try {
            setSwitchingRisk(true);
            await scoringService.switchRiskVersion(version);
            toast({
                title: 'Success',
                description: `Switched Risk Model to version ${version.toUpperCase()}`,
            });
            // Refresh data
            await fetchFlaskData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to switch Risk Model version.',
                variant: 'destructive',
            });
        } finally {
            setSwitchingRisk(false);
        }
    };

    const handleSwitchIncomeVersion = async (version: 'v1' | 'v2') => {
        try {
            setSwitchingIncome(true);
            await scoringService.switchIncomeVersion(version);
            toast({
                title: 'Success',
                description: `Switched Income Model to version ${version.toUpperCase()}`,
            });
            // Refresh data
            await fetchFlaskData();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to switch Income Model version.',
                variant: 'destructive',
            });
        } finally {
            setSwitchingIncome(false);
        }
    };

    const activeRiskVersion = flaskInfo?.risk_api?.active_version || 'N/A';
    const riskV1 = flaskInfo?.risk_api?.versions?.v1;
    const riskV2 = flaskInfo?.risk_api?.versions?.v2;

    const activeIncomeVersion = flaskInfo?.income_api?.active_version || 'N/A';
    const incomeV1 = flaskInfo?.income_api?.versions?.v1;
    const incomeV2 = flaskInfo?.income_api?.versions?.v2;

    return (
        <div className="space-y-6">
            {/* Health Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Classification API</CardTitle>
                        {health?.risk_api ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {health?.risk_api ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Online
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Offline
                                </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">Port 5001</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Income Category API</CardTitle>
                        {health?.income_api ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {health?.income_api ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Online
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Offline
                                </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">Port 5002</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk V{activeRiskVersion.toUpperCase()} | Income V{activeIncomeVersion.toUpperCase()}</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Risk Model</p>
                                <div className="text-xl font-bold">{activeRiskVersion.toUpperCase()}</div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Income Model</p>
                                <div className="text-xl font-bold">{activeIncomeVersion.toUpperCase()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Model Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Bank Classification Models</CardTitle>
                    <CardDescription>
                        Compare and switch between Risk Model versions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading model information...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Models</TableHead>
                                    <TableHead>R² Score</TableHead>
                                    <TableHead>RMSE</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Risk Version 1 */}
                                <TableRow>
                                    <TableCell className="font-medium">V1 (Rich)</TableCell>
                                    <TableCell>{riskV1?.num_features || 'N/A'}</TableCell>
                                    <TableCell>{riskV1?.num_models || 'N/A'}</TableCell>
                                    <TableCell>
                                        {riskV1?.metrics?.r2
                                            ? (riskV1.metrics.r2 * 100).toFixed(2) + '%'
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {riskV1?.metrics?.rmse
                                            ? riskV1.metrics.rmse.toFixed(4)
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {activeRiskVersion === 'v1' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {activeRiskVersion !== 'v1' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSwitchRiskVersion('v1')}
                                                disabled={switchingRisk || !health?.risk_api}
                                            >
                                                <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>

                                {/* Risk Version 2 */}
                                <TableRow>
                                    <TableCell className="font-medium">V2 (Lean)</TableCell>
                                    <TableCell>{riskV2?.num_features || 'N/A'}</TableCell>
                                    <TableCell>{riskV2?.num_models || 'N/A'}</TableCell>
                                    <TableCell>
                                        {riskV2?.metrics?.r2
                                            ? (riskV2.metrics.r2 * 100).toFixed(2) + '%'
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {riskV2?.metrics?.rmse
                                            ? riskV2.metrics.rmse.toFixed(4)
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {activeRiskVersion === 'v2' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {activeRiskVersion !== 'v2' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSwitchRiskVersion('v2')}
                                                disabled={switchingRisk || !health?.risk_api}
                                            >
                                                <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Income Model Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Income Category Models</CardTitle>
                    <CardDescription>
                        Compare and switch between Income Classification Model versions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading model information...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Classes</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Income Version 1 */}
                                <TableRow>
                                    <TableCell className="font-medium">V1 (Full)</TableCell>
                                    <TableCell>{incomeV1?.num_features || 'N/A'}</TableCell>
                                    <TableCell>3 (Low, Med, High)</TableCell>
                                    <TableCell>
                                        {incomeV1?.metrics?.accuracy
                                            ? (incomeV1.metrics.accuracy * 100).toFixed(2) + '%'
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {activeIncomeVersion === 'v1' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {activeIncomeVersion !== 'v1' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSwitchIncomeVersion('v1')}
                                                disabled={switchingIncome || !health?.income_api}
                                            >
                                                <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>

                                {/* Income Version 2 */}
                                <TableRow>
                                    <TableCell className="font-medium">V2 (Risk)</TableCell>
                                    <TableCell>{incomeV2?.num_features || 'N/A'}</TableCell>
                                    <TableCell>3 (Low, Med, High)</TableCell>
                                    <TableCell>
                                        {incomeV2?.metrics?.accuracy
                                            ? (incomeV2.metrics.accuracy * 100).toFixed(2) + '%'
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {activeIncomeVersion === 'v2' ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {activeIncomeVersion !== 'v2' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSwitchIncomeVersion('v2')}
                                                disabled={switchingIncome || !health?.income_api}
                                            >
                                                <ArrowRightLeft className="w-3 h-3 mr-1" /> Switch
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    onClick={fetchFlaskData}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Custom Training Section (V3) */}
            <CustomTrainingSection />
        </div>
    );
}
