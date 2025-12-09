'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    GripVertical,
    Sparkles,
    TrendingUp,
    CheckCircle2,
    Loader2,
    BarChart3,
    Activity,
    Zap,
    AlertTriangle,
} from 'lucide-react';

interface Feature {
    id: string;
    name: string;
    description: string;
    currentPriority: number;
}

const RISK_MODEL_FEATURES: Feature[] = [
    {
        id: 'payment_history',
        name: 'Payment History',
        description: 'Track record of past loan repayments and defaults',
        currentPriority: 1,
    },
    {
        id: 'outstanding_loans',
        name: 'Outstanding Loans',
        description: 'Current debt obligations and repayment burden',
        currentPriority: 2,
    },
    {
        id: 'dependency_ratio',
        name: 'Dependency Ratio',
        description: 'Number of dependents relative to earning members',
        currentPriority: 3,
    },
    {
        id: 'income_stability',
        name: 'Income Stability',
        description: 'Consistency and reliability of income sources',
        currentPriority: 4,
    },
    {
        id: 'loan_to_income_ratio',
        name: 'Loan-to-Income Ratio',
        description: 'Requested loan amount relative to monthly income',
        currentPriority: 5,
    },
];

export default function AdvancedMLConfiguration() {
    const [features, setFeatures] = useState<Feature[]>(RISK_MODEL_FEATURES);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const [metrics, setMetrics] = useState<any>(null);

    const handleDragStart = (index: number) => {
        setDraggedItem(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const newFeatures = [...features];
        const draggedFeature = newFeatures[draggedItem];
        newFeatures.splice(draggedItem, 1);
        newFeatures.splice(index, 0, draggedFeature);

        // Update priorities
        newFeatures.forEach((feature, idx) => {
            feature.currentPriority = idx + 1;
        });

        setFeatures(newFeatures);
        setDraggedItem(index);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleTrainModel = async () => {
        setIsTraining(true);
        setTrainingComplete(false);
        setMetrics(null);

        // Simulate 10-second training
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Generate mock metrics for Risk Model
        const mockMetrics = {
            accuracy: (0.85 + Math.random() * 0.1).toFixed(4),
            precision: (0.82 + Math.random() * 0.12).toFixed(4),
            recall: (0.88 + Math.random() * 0.08).toFixed(4),
            f1Score: (0.84 + Math.random() * 0.1).toFixed(4),
            auc: (0.91 + Math.random() * 0.07).toFixed(4),
            rmse: (12 + Math.random() * 5).toFixed(2),
            trainingTime: '10.2s',
            samplesProcessed: '47,832',
            modelVersion: 'v3.0-risk',
            timestamp: new Date().toLocaleString(),
        };

        setMetrics(mockMetrics);
        setIsTraining(false);
        setTrainingComplete(true);
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1:
                return 'bg-purple-500/20 border-purple-400/40 text-purple-300';
            case 2:
                return 'bg-blue-500/20 border-blue-400/40 text-blue-300';
            case 3:
                return 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300';
            case 4:
                return 'bg-teal-500/20 border-teal-400/40 text-teal-300';
            case 5:
                return 'bg-green-500/20 border-green-400/40 text-green-300';
            default:
                return 'bg-gray-500/20 border-gray-400/40 text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Advanced ML Configuration
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Customize Risk Model feature priorities and train custom models
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-red-500/20 text-red-300 border-red-400/30 px-4 py-2">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Risk Model
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 px-4 py-2">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Experimental
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Feature Priority Configuration */}
                <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Settings className="w-5 h-5 text-purple-400" />
                            Feature Priority Ranking
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Drag to reorder risk features by importance (1 = highest priority)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`
                  group relative flex items-center gap-3 p-4 rounded-lg border-2 
                  transition-all duration-200 cursor-move
                  ${draggedItem === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                  ${getPriorityColor(feature.currentPriority)}
                  hover:shadow-lg hover:scale-[1.02]
                `}
                            >
                                {/* Drag Handle */}
                                <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />

                                {/* Priority Badge */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                                    {feature.currentPriority}
                                </div>

                                {/* Feature Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white truncate">{feature.name}</h4>
                                    <p className="text-xs text-gray-400 truncate">{feature.description}</p>
                                </div>

                                {/* Priority Indicator */}
                                {feature.currentPriority === 1 && (
                                    <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                                )}
                            </div>
                        ))}

                        {/* Info Box */}
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                            <p className="text-xs text-blue-300 flex items-start gap-2">
                                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Higher priority features will have more influence in the risk model's decision-making process.
                                    Drag features up or down to adjust their importance.
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Training & Metrics */}
                <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BarChart3 className="w-5 h-5 text-green-400" />
                            Risk Model Training
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Train a custom risk model with your feature priorities
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Train Button */}
                        <Button
                            onClick={handleTrainModel}
                            disabled={isTraining}
                            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                            {isTraining ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Training Risk Model...
                                </>
                            ) : trainingComplete ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Train Again
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Train Custom Risk Model
                                </>
                            )}
                        </Button>

                        {/* Training Progress */}
                        {isTraining && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-progress" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {['Preprocessing', 'Training', 'Validating'].map((stage) => (
                                        <div key={stage} className="p-2 bg-white/5 rounded-lg">
                                            <Loader2 className="w-4 h-4 mx-auto mb-1 animate-spin text-purple-400" />
                                            <p className="text-xs text-gray-400">{stage}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metrics Display */}
                        {metrics && !isTraining && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-semibold">Training Complete!</span>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Accuracy', value: metrics.accuracy, icon: TrendingUp, color: 'text-green-400' },
                                        { label: 'Precision', value: metrics.precision, icon: Activity, color: 'text-blue-400' },
                                        { label: 'Recall', value: metrics.recall, icon: BarChart3, color: 'text-purple-400' },
                                        { label: 'F1 Score', value: metrics.f1Score, icon: Zap, color: 'text-yellow-400' },
                                        { label: 'AUC-ROC', value: metrics.auc, icon: TrendingUp, color: 'text-pink-400' },
                                        { label: 'RMSE', value: metrics.rmse, icon: Activity, color: 'text-orange-400' },
                                    ].map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                                <span className="text-xs text-gray-400">{metric.label}</span>
                                            </div>
                                            <p className="text-xl font-bold text-white">{metric.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Additional Info */}
                                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Training Time:</span>
                                        <span className="text-white font-semibold">{metrics.trainingTime}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Samples Processed:</span>
                                        <span className="text-white font-semibold">{metrics.samplesProcessed}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Model Version:</span>
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                                            {metrics.modelVersion}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Timestamp:</span>
                                        <span className="text-white text-xs">{metrics.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Initial State */}
                        {!metrics && !isTraining && (
                            <div className="text-center py-8 text-gray-400">
                                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
                                <p className="text-sm">Configure risk feature priorities above, then train your custom model</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 10s linear;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
