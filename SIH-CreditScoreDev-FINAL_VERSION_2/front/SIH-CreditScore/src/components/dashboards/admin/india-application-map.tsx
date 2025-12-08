'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { geoPath, geoMercator } from 'd3-geo';
import { select } from 'd3-selection';
import { scaleThreshold } from 'd3-scale';
import { interpolateBlues, interpolateOranges, interpolateGreens, interpolateReds } from 'd3-scale-chromatic';
import { json } from 'd3-fetch';
import { ZoomIn, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StateApplicationStats } from '@/services/application-analytics-service';

interface IndiaApplicationMapProps {
    data: StateApplicationStats[];
    className?: string;
}

type MetricType = 'scoring' | 'sanctioned' | 'rejected' | 'amount';

const METRIC_CONFIG = {
    scoring: {
        label: 'Applications Scoring',
        color: interpolateOranges,
        key: 'scoringCount' as const,
    },
    sanctioned: {
        label: 'Applications Sanctioned',
        color: interpolateGreens,
        key: 'sanctionedCount' as const,
    },
    rejected: {
        label: 'Applications Rejected',
        color: interpolateReds,
        key: 'rejectedCount' as const,
    },
    amount: {
        label: 'Total Amount Requested',
        color: interpolateBlues,
        key: 'totalAmountRequested' as const,
    },
};

const PIE_COLORS = {
    scoring: '#f97316',    // Orange
    sanctioned: '#22c55e', // Green
    rejected: '#ef4444',   // Red
};

const STATE_NAMES: { [key: string]: string } = {
    'Andaman & Nicobar Island': 'Andaman and Nicobar',
    'Andhra Pradesh': 'Andhra Pradesh',
    'Arunanchal Pradesh': 'Arunachal Pradesh',
    'Assam': 'Assam',
    'Bihar': 'Bihar',
    'Chandigarh': 'Chandigarh',
    'Chhattisgarh': 'Chhattisgarh',
    'Dadara & Nagar Havelli': 'Dadra and Nagar Haveli',
    'Daman & Diu': 'Daman and Diu',
    'Delhi': 'Delhi',
    'Goa': 'Goa',
    'Gujarat': 'Gujarat',
    'Haryana': 'Haryana',
    'Himachal Pradesh': 'Himachal Pradesh',
    'Jammu & Kashmir': 'Jammu and Kashmir',
    'Jharkhand': 'Jharkhand',
    'Karnataka': 'Karnataka',
    'Kerala': 'Kerala',
    'Lakshadweep': 'Lakshadweep',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Maharashtra': 'Maharashtra',
    'Manipur': 'Manipur',
    'Meghalaya': 'Meghalaya',
    'Mizoram': 'Mizoram',
    'Nagaland': 'Nagaland',
    'Odisha': 'Odisha',
    'Puducherry': 'Puducherry',
    'Punjab': 'Punjab',
    'Rajasthan': 'Rajasthan',
    'Sikkim': 'Sikkim',
    'Tamil Nadu': 'Tamil Nadu',
    'Telangana': 'Telangana',
    'Tripura': 'Tripura',
    'Uttar Pradesh': 'Uttar Pradesh',
    'Uttarakhand': 'Uttarakhand',
    'West Bengal': 'West Bengal',
};

// Format numbers with K, L, Cr abbreviations
function formatNumber(num: number): string {
    if (num >= 10000000) {
        return (num / 10000000).toFixed(1) + 'Cr';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function IndiaApplicationMap({ data, className }: IndiaApplicationMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('scoring');
    const [hoveredState, setHoveredState] = useState<{ name: string; value: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [zoomedState, setZoomedState] = useState<string | null>(null);
    const [selectedStateForPie, setSelectedStateForPie] = useState<string | null>(null);
    const [dropdownSelectedState, setDropdownSelectedState] = useState<string>('all');
    const [geoDataCache, setGeoDataCache] = useState<any>(null);

    const resetView = useCallback(() => {
        setZoomedState(null);
    }, []);

    const resetPieSelection = useCallback(() => {
        setSelectedStateForPie(null);
    }, []);

    // Get absolute count for a state
    const getStateValue = useCallback((stateName: string): number => {
        const state = data.find(d =>
            d.state?.toLowerCase() === stateName?.toLowerCase() ||
            STATE_NAMES[stateName]?.toLowerCase() === d.state?.toLowerCase()
        );
        if (!state) return 0;

        const metricKey = METRIC_CONFIG[selectedMetric].key;
        return Number(state[metricKey]) || 0;
    }, [data, selectedMetric]);

    // Get percentage for color intensity: (state metric / all India metric) * 100
    const getStatePercentage = useCallback((stateName: string): number => {
        const stateValue = getStateValue(stateName);
        if (stateValue === 0) return 0;

        // Calculate total for all India for this metric
        const allIndiaTotal = data.reduce((sum, state) => {
            const metricKey = METRIC_CONFIG[selectedMetric].key;
            return sum + (Number(state[metricKey]) || 0);
        }, 0);

        if (allIndiaTotal === 0) return 0;
        return (stateValue / allIndiaTotal) * 100;
    }, [data, selectedMetric, getStateValue]);

    // Get pie chart data
    const getPieData = useCallback(() => {
        if (!selectedStateForPie) {
            // Dropdown mode: Show breakdown by status for selected state
            const targetState = dropdownSelectedState === 'all'
                ? null
                : data.find(d => d.state === dropdownSelectedState);

            if (dropdownSelectedState === 'all' || !targetState) {
                // Show all India
                let scoringTotal = 0;
                let sanctionedTotal = 0;
                let rejectedTotal = 0;

                data.forEach(state => {
                    scoringTotal += state.scoringCount;
                    sanctionedTotal += state.sanctionedCount;
                    rejectedTotal += state.rejectedCount;
                });

                return [
                    { name: 'Scoring', value: scoringTotal, color: PIE_COLORS.scoring },
                    { name: 'Sanctioned', value: sanctionedTotal, color: PIE_COLORS.sanctioned },
                    { name: 'Rejected', value: rejectedTotal, color: PIE_COLORS.rejected },
                ];
            } else {
                // Show selected state from dropdown
                return [
                    { name: 'Scoring', value: targetState.scoringCount, color: PIE_COLORS.scoring },
                    { name: 'Sanctioned', value: targetState.sanctionedCount, color: PIE_COLORS.sanctioned },
                    { name: 'Rejected', value: targetState.rejectedCount, color: PIE_COLORS.rejected },
                ];
            }
        } else {
            // Map click mode: Show selected state vs rest of India for current metric
            const selectedState = data.find(d =>
                d.state?.toLowerCase() === selectedStateForPie?.toLowerCase() ||
                STATE_NAMES[selectedStateForPie]?.toLowerCase() === d.state?.toLowerCase()
            );

            if (!selectedState) return [];

            const metricKey = METRIC_CONFIG[selectedMetric].key;
            const selectedStateValue = Number(selectedState[metricKey]) || 0;

            // Calculate rest of India
            const allIndiaTotal = data.reduce((sum, state) => {
                return sum + (Number(state[metricKey]) || 0);
            }, 0);

            const restOfIndiaValue = allIndiaTotal - selectedStateValue;

            return [
                {
                    name: selectedStateForPie,
                    value: selectedStateValue,
                    color: METRIC_CONFIG[selectedMetric].color(0.8)
                },
                {
                    name: 'Rest of India',
                    value: restOfIndiaValue,
                    color: '#94a3b8'
                },
            ].filter(item => item.value > 0);
        }
    }, [data, selectedStateForPie, selectedMetric, dropdownSelectedState]);

    useEffect(() => {
        if (!svgRef.current) return;

        const width = 600;
        const height = 700;

        const svg = select(svgRef.current);
        svg.selectAll('*').remove();

        const projection = geoMercator()
            .center([78.9, 22.5])
            .scale(zoomedState ? 2500 : 1000)
            .translate([width / 2, height / 2]);

        const path = geoPath().projection(projection);

        // Adjust center for zoomed state
        if (zoomedState && geoDataCache) {
            const selectedFeature = geoDataCache.features.find(
                (f: any) => f.properties.ST_NM === zoomedState
            );
            if (selectedFeature) {
                const bounds = path.bounds(selectedFeature);
                const [[x0, y0], [x1, y1]] = bounds;
                const centerX = (x0 + x1) / 2;
                const centerY = (y0 + y1) / 2;
                const dx = width / 2 - centerX;
                const dy = height / 2 - centerY;
                projection.translate([width / 2 + dx, height / 2 + dy]);
            }
        }

        // Discrete color scale with 5 bands: 0-20, 20-40, 40-60, 60-80, 80-100
        const colorScale = scaleThreshold<number, string>()
            .domain([20, 40, 60, 80])
            .range([
                METRIC_CONFIG[selectedMetric].color(0.2),
                METRIC_CONFIG[selectedMetric].color(0.4),
                METRIC_CONFIG[selectedMetric].color(0.6),
                METRIC_CONFIG[selectedMetric].color(0.8),
                METRIC_CONFIG[selectedMetric].color(1.0),
            ]);

        json('https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson')
            .then((topology: any) => {
                setGeoDataCache(topology);
                const states = zoomedState
                    ? topology.features.filter((f: any) => f.properties.ST_NM === zoomedState)
                    : topology.features;

                const stateGroups = svg
                    .selectAll('g.state')
                    .data(states)
                    .enter()
                    .append('g')
                    .attr('class', 'state');

                stateGroups
                    .append('path')
                    .attr('d', path as any)
                    .attr('fill', (d: any) => {
                        const percentage = getStatePercentage(d.properties.ST_NM);
                        return percentage > 0 ? colorScale(percentage) : '#f3f4f6';
                    })
                    .attr('stroke', (d: any) => {
                        const stateName = STATE_NAMES[d.properties.ST_NM] || d.properties.ST_NM;
                        return selectedStateForPie?.toLowerCase() === stateName.toLowerCase() ? '#000000' : '#ffffff';
                    })
                    .attr('stroke-width', (d: any) => {
                        const stateName = STATE_NAMES[d.properties.ST_NM] || d.properties.ST_NM;
                        if (selectedStateForPie?.toLowerCase() === stateName.toLowerCase()) return 3;
                        return zoomedState ? 2 : 1.5;
                    })
                    .style('cursor', 'pointer')
                    .style('transition', 'all 0.3s ease')
                    .on('mouseenter', function (event: any, d: any) {
                        const value = getStateValue(d.properties.ST_NM);
                        if (value > 0) {
                            select(this)
                                .attr('stroke-width', 2.5)
                                .attr('filter', 'brightness(1.1)');

                            const state = data.find(s =>
                                s.state?.toLowerCase() === d.properties.ST_NM?.toLowerCase() ||
                                STATE_NAMES[d.properties.ST_NM]?.toLowerCase() === s.state?.toLowerCase()
                            );

                            if (state) {
                                setHoveredState({ name: state.state, value: getStateValue(state.state) });
                                setMousePos({ x: event.pageX, y: event.pageY });
                            }
                        }
                    })
                    .on('mousemove', (event: any) => {
                        setMousePos({ x: event.pageX, y: event.pageY });
                    })
                    .on('mouseleave', function (event: any, d: any) {
                        const stateName = STATE_NAMES[d.properties.ST_NM] || d.properties.ST_NM;
                        const strokeWidth = selectedStateForPie?.toLowerCase() === stateName.toLowerCase() ? 3 : (zoomedState ? 2 : 1.5);
                        select(this)
                            .attr('stroke-width', strokeWidth)
                            .attr('filter', 'none');
                        setHoveredState(null);
                    })
                    .on('click', (event: any, d: any) => {
                        const stateName = STATE_NAMES[d.properties.ST_NM] || d.properties.ST_NM;
                        setSelectedStateForPie(stateName);
                    })
                    .on('dblclick', (event: any, d: any) => {
                        event.stopPropagation();
                        setZoomedState(d.properties.ST_NM);
                    });

                // Add state labels with count numbers
                stateGroups
                    .append('text')
                    .attr('transform', (d: any) => {
                        const centroid = path.centroid(d);
                        return `translate(${centroid})`;
                    })
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('font-size', zoomedState ? '14px' : '11px')
                    .attr('font-weight', '700')
                    .attr('fill', (d: any) => {
                        const percentage = getStatePercentage(d.properties.ST_NM);
                        return percentage > 50 ? '#ffffff' : '#1f2937';
                    })
                    .attr('pointer-events', 'none')
                    .style('text-shadow', (d: any) => {
                        const percentage = getStatePercentage(d.properties.ST_NM);
                        return percentage > 50
                            ? '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                            : '0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7)';
                    })
                    .text((d: any) => {
                        const value = getStateValue(d.properties.ST_NM);
                        return value > 0 ? formatNumber(value) : '';
                    });
            });
    }, [data, selectedMetric, zoomedState, selectedStateForPie, getStateValue, getStatePercentage]);

    const pieData = getPieData();

    return (
        <div className={cn('grid grid-cols-1 lg:grid-cols-5 gap-6', className)}>
            {/* India Map - Left Side (60%) */}
            <Card className="lg:col-span-3 border-0 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold">
                        {zoomedState ? `${zoomedState} - Detailed View` : 'State-wise Application Distribution'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {zoomedState && (
                            <Button variant="outline" size="sm" onClick={resetView}>
                                <ZoomIn className="h-4 w-4 mr-2" />
                                Show All States
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 shadow-inner">
                        <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs text-muted-foreground">
                            💡 Click to select • Double-click to zoom
                        </div>
                        <svg
                            ref={svgRef}
                            viewBox="0 0 600 700"
                            className="w-full h-auto transition-all duration-500"
                            style={{ maxHeight: zoomedState ? '600px' : '500px' }}
                        />

                        {hoveredState && (
                            <div
                                className="fixed bg-gradient-to-br from-slate-900 to-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 pointer-events-none border border-white/10 backdrop-blur-sm"
                                style={{
                                    left: `${Math.min(mousePos.x + 15, window.innerWidth - 250)}px`,
                                    top: `${Math.max(10, Math.min(mousePos.y - 50, window.innerHeight - 100))}px`,
                                }}
                            >
                                <div className="font-semibold text-sm mb-1">{hoveredState.name}</div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-2xl font-bold">
                                        {formatNumber(hoveredState.value)}
                                    </div>
                                    <div className="text-xs text-slate-400">{METRIC_CONFIG[selectedMetric].label.toLowerCase()}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm font-medium text-center mb-3">
                            State Contribution to National {METRIC_CONFIG[selectedMetric].label}
                        </div>
                        <div className="relative">
                            <div className="h-4 rounded-full overflow-hidden shadow-md flex">
                                <div className="flex-1" style={{ backgroundColor: METRIC_CONFIG[selectedMetric].color(0.2) }} />
                                <div className="flex-1" style={{ backgroundColor: METRIC_CONFIG[selectedMetric].color(0.4) }} />
                                <div className="flex-1" style={{ backgroundColor: METRIC_CONFIG[selectedMetric].color(0.6) }} />
                                <div className="flex-1" style={{ backgroundColor: METRIC_CONFIG[selectedMetric].color(0.8) }} />
                                <div className="flex-1" style={{ backgroundColor: METRIC_CONFIG[selectedMetric].color(1.0) }} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium px-1">
                            <span>0-20%</span>
                            <span>20-40%</span>
                            <span>40-60%</span>
                            <span>60-80%</span>
                            <span>80-100%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pie Chart - Right Side (40%) */}
            <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold">
                        Application Distribution
                    </CardTitle>
                    {selectedStateForPie && (
                        <Button variant="ghost" size="sm" onClick={resetPieSelection}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {/* Dropdown for state selection when no map selection */}
                    {!selectedStateForPie && (
                        <div className="mb-4">
                            <Select value={dropdownSelectedState} onValueChange={setDropdownSelectedState}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="all">All India</SelectItem>
                                    {data.map((state) => (
                                        <SelectItem key={state.state} value={state.state}>
                                            {state.state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Title showing current selection */}
                    <div className="text-center mb-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            {selectedStateForPie
                                ? `${selectedStateForPie} vs Rest of India`
                                : (dropdownSelectedState === 'all' ? 'All India' : dropdownSelectedState)}
                        </p>
                        {selectedStateForPie && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {METRIC_CONFIG[selectedMetric].label}
                            </p>
                        )}
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatNumber(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 space-y-2">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-semibold">{formatNumber(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}