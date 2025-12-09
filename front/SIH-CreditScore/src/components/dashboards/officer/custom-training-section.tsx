'use client';

import { useState } from 'react';
import { scoringService } from '@/services/scoring-service';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    UploadCloud,
    ChevronUp,
    ChevronDown,
    Layers,
    Cpu,
    ArrowRight,
    FileSpreadsheet,
} from 'lucide-react';

const DEFAULT_FEATURES = [
    { id: 'current_outstanding', label: 'Current Outstanding' },
    { id: 'loan_amount', label: 'Loan Amount' },
    { id: 'emis_pending', label: 'EMIs Pending' },
];

export default function CustomTrainingSection() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [features, setFeatures] = useState(DEFAULT_FEATURES);
    const [training, setTraining] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const moveFeature = (index: number, direction: 'up' | 'down') => {
        const newFeatures = [...features];
        if (direction === 'up' && index > 0) {
            [newFeatures[index], newFeatures[index - 1]] = [newFeatures[index - 1], newFeatures[index]];
        } else if (direction === 'down' && index < newFeatures.length - 1) {
            [newFeatures[index], newFeatures[index + 1]] = [newFeatures[index + 1], newFeatures[index]];
        }
        setFeatures(newFeatures);
    };

    const handleTrain = async () => {
        if (!file) {
            toast({
                title: 'Missing Dataset',
                description: 'Please upload a CSV dataset suitable for retraining.',
                variant: 'destructive',
            });
            return;
        }

        setTraining(true);
        setTraining(true);
        try {
            // Extract ordered Feature IDs
            const priorityConfig = features.map(f => f.id);

            const response = await scoringService.trainCustomModel(file, priorityConfig);

            toast({
                title: 'Training Successful',
                description: `V3 Model trained! RMSE: ${response.metrics.rmse.toFixed(4)}, R²: ${(response.metrics.r2 * 100).toFixed(2)}%`,
                variant: 'default', // success
            });

            // Allow time for state update / refresh if needed
            setTimeout(() => {
                window.location.reload(); // Simple reload to refresh the model list
            }, 2000);

        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Training Failed',
                description: error.message || 'An error occurred during training.',
                variant: 'destructive',
            });
        } finally {
            setTraining(false);
        }
    };

    return (
        <Card className="overflow-hidden shadow-lg border border-slate-200">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Cpu className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle>Train Custom Model (V3)</CardTitle>
                        <CardDescription>
                            Upload a verified dataset and configure feature priorities to generate Version 3.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Step 1: Upload */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-600">Step 1</span>
                        Upload Training Dataset
                    </Label>
                    <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-slate-50 hover:border-blue-400">
                        <div className="p-3 bg-blue-50 rounded-full">
                            <UploadCloud className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {file ? file.name : "Drag & drop or Click to upload CSV"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supported format: .csv (Max 50MB)
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 opacity-0 cursor-pointer h-full"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <Separator />

                {/* Step 2: Priority Configuration */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-600">Step 2</span>
                        Configure Feature Priority (V3 Scoring)
                    </Label>
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                            <span>Priority Rank</span>
                            <span>Feature Transformation Impact</span>
                        </div>

                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`flex items-center justify-between p-3 rounded-md border ${index === 0 ? 'bg-white border-blue-200 shadow-sm' : 'bg-white/50 border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center p-0 rounded-full">
                                        {index + 1}
                                    </Badge>
                                    <span className="font-medium">{feature.label}</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        {index === 0 && (
                                            <>
                                                <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">Scale Method A</Badge>
                                                <Badge variant="outline" className="text-[10px] h-5 bg-purple-50 text-purple-700 border-purple-200">Scale Method B</Badge>
                                            </>
                                        )}
                                        {index === 1 && (
                                            <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">Scale Method A</Badge>
                                        )}
                                        {index > 1 && (
                                            <Badge variant="outline" className="text-[10px] h-5 text-slate-500">Original Only</Badge>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            disabled={index === 0}
                                            onClick={() => moveFeature(index, 'up')}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            disabled={index === features.length - 1}
                                            onClick={() => moveFeature(index, 'down')}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Higher priority features undergo more extensive scaling transformations (A & B) for enhanced pattern detection.
                    </p>
                </div>

            </CardContent>
            <CardFooter className="bg-slate-50/50 flex justify-end pt-4 pb-4">
                <Button
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
                    onClick={handleTrain}
                    disabled={training}
                >
                    {training ? (
                        <>Training V3 Model...</>
                    ) : (
                        <>
                            Start Training V3 Pipeline
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card >
    );
}
