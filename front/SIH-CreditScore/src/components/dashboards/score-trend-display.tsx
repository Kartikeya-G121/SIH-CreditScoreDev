'use client';

import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { MLExplanations } from '@/types/ml-explanations';

interface ScoreTrendDisplayProps {
    explanations?: MLExplanations | null;
    className?: string;
}

export function ScoreTrendDisplay({ explanations, className = '' }: ScoreTrendDisplayProps) {
    const scoreTrend = explanations?.scoreTrend;

    // If no trend data, show placeholder
    if (!scoreTrend) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-white/80" />
                    <h3 className="text-sm uppercase tracking-wider text-white/80 font-semibold">Score Trend</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-center py-2 text-white/60 text-sm">
                        Score trend will appear after re-scoring
                    </div>
                </div>
            </div>
        );
    }

    const isImprovement = scoreTrend.change >= 0;
    const changeValue = Math.abs(scoreTrend.change);
    const changePercent = Math.abs(scoreTrend.changePercent);

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-white/80" />
                <h3 className="text-sm uppercase tracking-wider text-white/80 font-semibold">Score Trend</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                {/* Sparkline Container */}
                <div className="h-12 mb-3 flex items-end gap-1">
                    {/* Simple visualization showing trend */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        // Generate heights that show the trend
                        const baseHeight = 30;
                        const trendFactor = isImprovement ? (i / 11) * 30 : ((11 - i) / 11) * 30;
                        const randomVariation = Math.random() * 10 - 5;
                        const height = Math.max(10, Math.min(100, baseHeight + trendFactor + randomVariation));

                        return (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-white/80 to-white/40 rounded-sm transition-all hover:from-white hover:to-white/60"
                                style={{ height: `${height}%` }}
                            />
                        );
                    })}
                </div>

                {/* Trend Summary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 ${isImprovement ? 'bg-green-500/30' : 'bg-red-500/30'} rounded-full`}>
                            {isImprovement ? (
                                <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-red-300" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white/95">
                                {isImprovement ? 'Improved' : 'Declined'} by {changeValue.toFixed(1)} points
                            </p>
                            <p className="text-xs text-white/70">
                                {scoreTrend.period === 'MONTHLY' ? 'This month' : 'Recent'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-lg font-bold ${isImprovement ? 'text-green-300' : 'text-red-300'}`}>
                            {isImprovement ? '+' : '-'}{changeValue.toFixed(1)}
                        </p>
                        <p className="text-xs text-white/60">
                            {changePercent.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
