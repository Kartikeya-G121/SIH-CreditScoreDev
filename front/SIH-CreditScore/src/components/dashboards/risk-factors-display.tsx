'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
    History,
    IndianRupee,
    Users,
    Landmark,
    Activity,
    Sparkles,
} from 'lucide-react';
import type { RiskFactor, MLExplanations } from '@/types/ml-explanations';

interface RiskFactorsDisplayProps {
    explanations?: MLExplanations | null;
    className?: string;
}

// Static fallback data when ML explanations are not available
const FALLBACK_RISK_FACTORS: RiskFactor[] = [
    {
        name: 'Payment History',
        impact: 'MODERATE_RISK',
        shapValue: 0.12,
        description: 'Complete a loan application to see your actual payment history analysis',
    },
    {
        name: 'Income Stability',
        impact: 'LOW_RISK',
        shapValue: 0.05,
        description: 'Apply for a loan to get personalized income stability assessment',
    },
    {
        name: 'Dependency Ratio',
        impact: 'GOOD',
        shapValue: -0.08,
        description: 'Your dependency ratio will be analyzed after loan application',
    },
    {
        name: 'Credit Utilization',
        impact: 'VERY_GOOD',
        shapValue: -0.15,
        description: 'Credit utilization metrics available after scoring',
    },
];

// Map feature names to icons
const getIconForFactor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('payment') || lowerName.includes('history')) return History;
    if (lowerName.includes('income') || lowerName.includes('salary')) return IndianRupee;
    if (lowerName.includes('dependency') || lowerName.includes('family')) return Users;
    if (lowerName.includes('borrowing') || lowerName.includes('loan')) return Landmark;
    if (lowerName.includes('credit') || lowerName.includes('utilization')) return Activity;
    return Activity;
};

// Get badge styling based on impact
const getImpactBadgeStyle = (impact: string) => {
    switch (impact) {
        case 'HIGH_RISK':
            return 'bg-red-500/30 hover:bg-red-500/40 text-white border-red-400/30';
        case 'MODERATE_RISK':
            return 'bg-orange-500/30 hover:bg-orange-500/40 text-white border-orange-400/30';
        case 'LOW_RISK':
            return 'bg-yellow-500/30 hover:bg-yellow-500/40 text-white border-yellow-400/30';
        case 'VERY_GOOD':
            return 'bg-green-500/30 hover:bg-green-500/40 text-white border-green-400/30';
        case 'GOOD':
            return 'bg-emerald-500/30 hover:bg-emerald-500/40 text-white border-emerald-400/30';
        default:
            return 'bg-gray-500/30 hover:bg-gray-500/40 text-white border-gray-400/30';
    }
};

// Get display label for impact
const getImpactLabel = (impact: string) => {
    switch (impact) {
        case 'HIGH_RISK':
            return 'High Risk';
        case 'MODERATE_RISK':
            return 'Moderate';
        case 'LOW_RISK':
            return 'Low Risk';
        case 'VERY_GOOD':
            return 'Excellent';
        case 'GOOD':
            return 'Good';
        default:
            return 'Neutral';
    }
};

export function RiskFactorsDisplay({ explanations, className = '' }: RiskFactorsDisplayProps) {
    // Use actual data if available, otherwise use fallback
    const hasRealData = explanations?.riskModel?.topFactors && explanations.riskModel.topFactors.length > 0;
    const topFactors = hasRealData
        ? explanations.riskModel.topFactors.slice(0, 4)
        : FALLBACK_RISK_FACTORS;

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-white/80" />
                <h3 className="text-sm uppercase tracking-wider text-white/80 font-semibold">Risk Factors</h3>
                {!hasRealData && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                        Sample Data
                    </Badge>
                )}
            </div>

            <div className="space-y-2.5">
                {topFactors.map((factor, index) => {
                    const Icon = getIconForFactor(factor.name);
                    const badgeStyle = getImpactBadgeStyle(factor.impact);
                    const impactLabel = getImpactLabel(factor.impact);

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between group transition-all duration-200 hover:bg-white/5 rounded-lg p-2 -mx-2"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Icon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                                <span className="text-sm text-white/90 truncate">{factor.name}</span>
                            </div>
                            <Badge
                                className={`${badgeStyle} backdrop-blur-sm px-3 py-0.5 text-xs font-medium flex-shrink-0 ml-2`}
                            >
                                {impactLabel}
                            </Badge>
                        </div>
                    );
                })}
            </div>

            {/* Show info message for fallback data */}
            {!hasRealData && (
                <div className="mt-3 p-2 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                    <p className="text-xs text-blue-300 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>Apply for a loan to see your personalized risk analysis based on ML models</span>
                    </p>
                </div>
            )}

            {/* Optional: Show model version and timestamp for real data */}
            {hasRealData && explanations.riskModel.modelVersion && (
                <div className="pt-2 mt-2 border-t border-white/10">
                    <p className="text-[10px] text-white/50 text-center">
                        Model: {explanations.riskModel.modelVersion} • Updated: {new Date(explanations.riskModel.timestamp).toLocaleDateString()}
                    </p>
                </div>
            )}
        </div>
    );
}
