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
import { interpolateGreens, interpolateReds, interpolateBlues } from 'd3-scale-chromatic';
import { json } from 'd3-fetch';
import { ZoomIn, X, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StatePerformanceStats } from '@/services/loan-portfolio-service';

interface GeographicRiskMapProps {
    data: StatePerformanceStats[];
    className?: string;
}

type MetricType = 'npaRate' | 'totalAum' | 'activeLoans';

const METRIC_CONFIG = {
    npaRate: {
        label: 'NPA Rate (%)',
        color: interpolateReds, // Red is intuitive for Risk/NPA
        key: 'npaRate' as const,
        format: (val: number) => `${val.toFixed(2)}%`,
        domain: [2, 4, 6, 8] // Thresholds for NPA %
    },
    totalAum: {
        label: 'AUM (Exposure)',
        color: interpolateBlues,
        key: 'totalAum' as const,
        format: (val: number) => formatNumber(val),
        domain: [1000000, 5000000, 10000000, 50000000] // Thresholds will be dynamic in real world, strict here for now
    },
    activeLoans: {
        label: 'Active Loans',
        color: interpolateGreens,
        key: 'activeLoans' as const,
        format: (val: number) => val.toString(),
        domain: [100, 500, 1000, 5000]
    },
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
        return '₹' + (num / 10000000).toFixed(2) + 'Cr';
    } else if (num >= 100000) {
        return '₹' + (num / 100000).toFixed(2) + 'L';
    } else if (num >= 1000) {
        return '₹' + (num / 1000).toFixed(2) + 'K';
    }
    return '₹' + num.toFixed(0);
}

export function GeographicRiskMap({ data, className }: GeographicRiskMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('npaRate');
    const [hoveredState, setHoveredState] = useState<{ name: string; value: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [zoomedState, setZoomedState] = useState<string | null>(null);
    const [dropdownSelectedState, setDropdownSelectedState] = useState<string>('all');
    const [geoDataCache, setGeoDataCache] = useState<any>(null);

    const resetView = useCallback(() => {
        setZoomedState(null);
    }, []);

    const getStateValue = useCallback((stateName: string): number => {
        const state = data.find(d =>
            d.state?.toLowerCase() === stateName?.toLowerCase() ||
            STATE_NAMES[stateName]?.toLowerCase() === d.state?.toLowerCase()
        );
        if (!state) return 0;
        const metricKey = METRIC_CONFIG[selectedMetric].key;
        return Number(state[metricKey]) || 0;
    }, [data, selectedMetric]);

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

        const colorScale = scaleThreshold<number, string>()
            .domain(METRIC_CONFIG[selectedMetric].domain)
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
                        const val = getStateValue(d.properties.ST_NM);
                        return val > 0 ? colorScale(val) : '#f3f4f6';
                    })
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', zoomedState ? 2 : 1)
                    .style('cursor', 'pointer')
                    .style('transition', 'all 0.3s ease')
                    .on('mouseenter', function (event: any, d: any) {
                        const value = getStateValue(d.properties.ST_NM);
                        if (value > 0 || selectedMetric === 'npaRate') {
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
                        select(this).attr('stroke-width', zoomedState ? 2 : 1).attr('filter', 'none');
                        setHoveredState(null);
                    })
                    .on('dblclick', (event: any, d: any) => {
                        event.stopPropagation();
                        setZoomedState(d.properties.ST_NM);
                    });

                // Add state labels
                stateGroups
                    .append('text')
                    .attr('transform', (d: any) => {
                        const centroid = path.centroid(d);
                        return `translate(${centroid})`;
                    })
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.35em')
                    .attr('font-size', zoomedState ? '14px' : '0px') // Only show when zoomed or ensure visibility
                    .attr('font-weight', '700')
                    .attr('fill', '#374151')
                    .attr('pointer-events', 'none')
                    .text((d: any) => {
                        const value = getStateValue(d.properties.ST_NM);
                        return value > 0 ? METRIC_CONFIG[selectedMetric].format(value) : '';
                    });
            });
    }, [data, selectedMetric, zoomedState, getStateValue]);

    return (
        <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
            <Card className="lg:col-span-3 border-0 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-red-600" />
                        </div>
                        {zoomedState ? `${zoomedState} - Detailed View` : 'Geographic Risk Heatmap'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                            <SelectTrigger className="w-[200px]">
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
                                Show All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative bg-slate-50 dark:bg-slate-900 rounded-xl p-6 min-h-[500px] flex items-center justify-center">
                        <svg
                            ref={svgRef}
                            viewBox="0 0 600 700"
                            className="w-full h-auto transition-all duration-500"
                            style={{ maxHeight: zoomedState ? '600px' : '500px' }}
                        />
                        {hoveredState && (
                            <div
                                className="fixed bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl z-50 pointer-events-none border border-border"
                                style={{
                                    left: `${Math.min(mousePos.x + 15, window.innerWidth - 200)}px`,
                                    top: `${Math.max(10, Math.min(mousePos.y - 50, window.innerHeight - 100))}px`,
                                }}
                            >
                                <div className="font-semibold text-sm">{hoveredState.name}</div>
                                <div className="text-xl font-bold text-primary">
                                    {METRIC_CONFIG[selectedMetric].format(hoveredState.value)}
                                </div>
                                <div className="text-xs text-muted-foreground">{METRIC_CONFIG[selectedMetric].label}</div>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg shadow-sm text-xs">
                            <div className="font-medium mb-2">{METRIC_CONFIG[selectedMetric].label} Intensity</div>
                            <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Low</span>
                                <div className="w-24 h-2 bg-gradient-to-r from-transparent via-current to-current opacity-50 rounded-full"
                                    style={{ backgroundImage: `linear-gradient(to right, ${METRIC_CONFIG[selectedMetric].color(0.2)}, ${METRIC_CONFIG[selectedMetric].color(1)})` }}></div>
                                <span className="text-muted-foreground">High</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
