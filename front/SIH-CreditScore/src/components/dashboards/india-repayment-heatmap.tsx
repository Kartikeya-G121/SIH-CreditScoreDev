'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface StateData {
    id: string;
    name: string;
    repaymentRate: number;
    totalAmount: number;
    beneficiaries: number;
}

interface IndiaRepaymentHeatmapProps {
    data: StateData[];
    className?: string;
}

export function IndiaRepaymentHeatmap({ data, className }: IndiaRepaymentHeatmapProps) {
    const [hoveredState, setHoveredState] = useState<StateData | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Get color based on repayment rate
    const getStateColor = (rate: number) => {
        if (rate >= 95) return '#ef4444'; // Red for highest
        if (rate >= 90) return '#f97316'; // Orange
        if (rate >= 85) return '#eab308'; // Yellow
        if (rate >= 80) return '#84cc16'; // Light green
        return '#22c55e'; // Green for lower
    };

    // Get glow intensity based on repayment rate
    const getGlowIntensity = (rate: number) => {
        if (rate >= 95) return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
        if (rate >= 90) return 'drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]';
        if (rate >= 85) return 'drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]';
        return '';
    };

    const handleMouseMove = (e: React.MouseEvent, state: StateData) => {
        setHoveredState(state);
        setTooltipPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredState(null);
    };

    // Simplified India map with major states (using approximate SVG paths)
    const statesPaths: Record<string, string> = {
        'Jammu & Kashmir': 'M 180 40 L 220 30 L 240 50 L 230 80 L 200 90 L 180 70 Z',
        'Himachal Pradesh': 'M 200 90 L 230 80 L 250 100 L 230 110 L 200 105 Z',
        'Punjab': 'M 180 100 L 200 105 L 210 120 L 190 130 L 170 120 Z',
        'Haryana': 'M 190 130 L 210 120 L 220 140 L 200 150 Z',
        'Delhi': 'M 200 145 L 205 140 L 210 145 L 205 150 Z',
        'Uttarakhand': 'M 230 110 L 250 100 L 270 120 L 250 130 Z',
        'Rajasthan': 'M 140 140 L 190 130 L 200 150 L 220 180 L 200 220 L 160 210 L 130 180 Z',
        'Uttar Pradesh': 'M 220 140 L 250 130 L 290 150 L 310 170 L 300 190 L 270 180 L 240 190 L 220 180 Z',
        'Bihar': 'M 300 190 L 310 170 L 340 180 L 350 200 L 330 210 Z',
        'Gujarat': 'M 100 200 L 140 180 L 160 210 L 150 250 L 120 260 L 90 240 Z',
        'Madhya Pradesh': 'M 160 210 L 200 220 L 240 190 L 270 180 L 280 210 L 270 240 L 240 250 L 200 240 L 180 230 Z',
        'Chhattisgarh': 'M 270 240 L 280 210 L 310 220 L 320 250 L 300 260 Z',
        'Maharashtra': 'M 150 250 L 200 240 L 240 250 L 250 290 L 220 310 L 180 300 L 150 280 Z',
        'Goa': 'M 150 290 L 160 280 L 170 295 L 160 305 Z',
        'Karnataka': 'M 160 305 L 180 300 L 220 310 L 230 350 L 200 370 L 170 360 L 155 330 Z',
        'Kerala': 'M 170 360 L 180 380 L 175 410 L 165 420 L 155 400 L 160 370 Z',
        'Tamil Nadu': 'M 200 370 L 230 350 L 250 370 L 255 400 L 240 420 L 210 410 L 190 390 Z',
        'Andhra Pradesh': 'M 220 310 L 250 290 L 280 300 L 290 330 L 270 350 L 240 350 L 230 330 Z',
        'Telangana': 'M 240 280 L 250 290 L 250 310 L 240 320 L 230 310 Z',
        'Odisha': 'M 300 260 L 320 250 L 340 270 L 350 290 L 330 310 L 310 300 L 290 280 Z',
        'West Bengal': 'M 330 210 L 350 200 L 370 220 L 380 250 L 370 270 L 350 260 L 340 240 Z',
        'Jharkhand': 'M 300 220 L 310 220 L 320 240 L 310 250 L 300 245 Z',
        'Assam': 'M 380 180 L 410 170 L 430 190 L 420 210 L 400 200 Z',
        'Meghalaya': 'M 400 200 L 410 195 L 420 205 L 410 215 Z',
        'Sikkim': 'M 350 160 L 360 155 L 365 165 L 355 170 Z',
        'Arunachal Pradesh': 'M 410 140 L 450 130 L 470 160 L 450 170 L 430 160 Z',
        'Nagaland': 'M 430 170 L 445 165 L 455 180 L 440 185 Z',
        'Manipur': 'M 440 185 L 450 180 L 455 195 L 445 200 Z',
        'Mizoram': 'M 435 200 L 445 200 L 450 215 L 440 220 Z',
        'Tripura': 'M 410 215 L 420 210 L 425 220 L 415 225 Z',
    };

    return (
        <div className={cn('relative w-full', className)}>
            <svg
                viewBox="0 0 550 500"
                className="w-full h-auto"
                style={{ maxHeight: '600px' }}
            >
                {/* Background */}
                <rect width="550" height="500" fill="hsl(var(--muted))" opacity="0.1" />

                {/* States */}
                {data.map((state) => {
                    const path = statesPaths[state.name];
                    if (!path) return null;

                    const color = getStateColor(state.repaymentRate);
                    const glowClass = getGlowIntensity(state.repaymentRate);
                    const isHovered = hoveredState?.id === state.id;

                    return (
                        <path
                            key={state.id}
                            d={path}
                            fill={color}
                            stroke="hsl(var(--background))"
                            strokeWidth="2"
                            className={cn(
                                'transition-all duration-300 cursor-pointer',
                                glowClass,
                                isHovered && 'opacity-90 scale-105'
                            )}
                            style={{
                                filter: isHovered
                                    ? `drop-shadow(0 0 12px ${color})`
                                    : state.repaymentRate >= 85
                                        ? `drop-shadow(0 0 6px ${color})`
                                        : 'none',
                                transformOrigin: 'center',
                            }}
                            onMouseMove={(e) => handleMouseMove(e, state)}
                            onMouseLeave={handleMouseLeave}
                        />
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hoveredState && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: tooltipPosition.x + 15,
                        top: tooltipPosition.y + 15,
                    }}
                >
                    <div className="bg-background border border-border rounded-lg shadow-2xl p-4 min-w-[200px] animate-in fade-in-0 zoom-in-95">
                        <h4 className="font-bold text-lg mb-2">{hoveredState.name}</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Repayment Rate:</span>
                                <span className="font-semibold">{hoveredState.repaymentRate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-semibold">₹{(hoveredState.totalAmount / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Beneficiaries:</span>
                                <span className="font-semibold">{hoveredState.beneficiaries.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
                <div className="text-sm font-medium">Repayment Rate:</div>
                {[
                    { label: '95%+', color: '#ef4444', glow: true },
                    { label: '90-94%', color: '#f97316', glow: true },
                    { label: '85-89%', color: '#eab308', glow: true },
                    { label: '80-84%', color: '#84cc16', glow: false },
                    { label: '<80%', color: '#22c55e', glow: false },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div
                            className={cn(
                                'w-6 h-6 rounded border-2 border-white',
                                item.glow && 'animate-pulse'
                            )}
                            style={{
                                backgroundColor: item.color,
                                boxShadow: item.glow ? `0 0 8px ${item.color}` : 'none',
                            }}
                        />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
