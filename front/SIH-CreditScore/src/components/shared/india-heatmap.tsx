'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { geoPath, geoMercator } from 'd3-geo';
import { select } from 'd3-selection';
import { scaleSequential } from 'd3-scale';
import { interpolateRdYlGn } from 'd3-scale-chromatic';
import { json } from 'd3-fetch';
import { feature } from 'topojson-client';
import { ZoomIn } from 'lucide-react';

interface StateData {
  name: string;
  value: number;
  color: string;
}

interface IndiaHeatmapProps {
  data: StateData[];
  title?: string;
  className?: string;
}

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

export function IndiaHeatmap({ data, title = 'State-wise Distribution', className }: IndiaHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredState, setHoveredState] = useState<{ name: string; value: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [geoDataCache, setGeoDataCache] = useState<any>(null);

  const resetView = useCallback(() => {
    setSelectedState(null);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 700;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = geoMercator()
      .center([78.9, 22.5])
      .scale(selectedState ? 2500 : 1000)
      .translate([width / 2, height / 2]);

    const path = geoPath().projection(projection);

    // Adjust center for selected state
    if (selectedState && geoDataCache) {
      const selectedFeature = geoDataCache.features.find(
        (f: any) => f.properties.ST_NM === selectedState
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

    const colorScale = (value: number) => {
      if (value >= 95) return '#059669';
      if (value >= 90) return '#10b981';
      if (value >= 85) return '#22c55e';
      if (value >= 80) return '#84cc16';
      if (value >= 75) return '#a3e635';
      if (value >= 70) return '#eab308';
      if (value >= 65) return '#fbbf24';
      return '#f97316';
    };

    const getStateValue = (stateName: string) => {
      const state = data.find(d => 
        d.name.toLowerCase() === stateName.toLowerCase() ||
        STATE_NAMES[stateName]?.toLowerCase() === d.name.toLowerCase()
      );
      return state?.value || 0;
    };

    json('https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson')
      .then((topology: any) => {
        setGeoDataCache(topology);
        const states = selectedState 
          ? topology.features.filter((f: any) => f.properties.ST_NM === selectedState)
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
            const value = getStateValue(d.properties.ST_NM);
            return value > 0 ? colorScale(value) : '#f3f4f6';
          })
          .attr('stroke', '#ffffff')
          .attr('stroke-width', selectedState ? 2 : 1.5)
          .style('cursor', 'pointer')
          .style('transition', 'all 0.3s ease')
          .on('mouseenter', function(event: any, d: any) {
            const value = getStateValue(d.properties.ST_NM);
            if (value > 0) {
              select(this)
                .attr('stroke-width', 2.5)
                .attr('filter', 'brightness(1.1)');
              
              const state = data.find(s => 
                s.name.toLowerCase() === d.properties.ST_NM.toLowerCase() ||
                STATE_NAMES[d.properties.ST_NM]?.toLowerCase() === s.name.toLowerCase()
              );
              
              if (state) {
                setHoveredState({ name: state.name, value: state.value });
                setMousePos({ x: event.pageX, y: event.pageY });
              }
            }
          })
          .on('mousemove', (event: any) => {
            setMousePos({ x: event.pageX, y: event.pageY });
          })
          .on('mouseleave', function() {
            select(this)
              .attr('stroke-width', selectedState ? 2 : 1.5)
              .attr('filter', 'none');
            setHoveredState(null);
          })
          .on('dblclick', (event: any, d: any) => {
            event.stopPropagation();
            setSelectedState(d.properties.ST_NM);
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
          .attr('font-size', selectedState ? '10px' : '8px')
          .attr('font-weight', '600')
          .attr('fill', '#1f2937')
          .attr('pointer-events', 'none')
          .style('text-shadow', '0 0 3px white, 0 0 3px white, 0 0 3px white')
          .text((d: any) => {
            const value = getStateValue(d.properties.ST_NM);
            if (value > 0 && (!selectedState || selectedState === d.properties.ST_NM)) {
              // Show abbreviated state names for better fit
              const name = d.properties.ST_NM;
              if (name.length > 12) {
                return name.split(' ').map((w: string) => w[0]).join('');
              }
              return name;
            }
            return '';
          })
      });
  }, [data, selectedState]);

  return (
    <Card className={cn('border-0 shadow-lg overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          {selectedState ? `${selectedState} - Detailed View` : title}
        </CardTitle>
        {selectedState && (
          <Button variant="outline" size="sm" onClick={resetView}>
            <ZoomIn className="h-4 w-4 mr-2" />
            Show All States
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 shadow-inner">
          <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs text-muted-foreground">
            💡 Double-click any state to zoom in
          </div>
          <svg
            ref={svgRef}
            viewBox="0 0 600 700"
            className="w-full h-auto transition-all duration-500"
            style={{ maxHeight: selectedState ? '600px' : '500px' }}
          />
          
          {hoveredState && (
            <div 
              className="fixed bg-gradient-to-br from-slate-900 to-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl z-50 pointer-events-none border border-white/10 backdrop-blur-sm"
              style={{
                left: `${mousePos.x + 15}px`,
                top: `${mousePos.y - 50}px`,
              }}
            >
              <div className="font-semibold text-sm mb-1">{hoveredState.name}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold" style={{ 
                  color: hoveredState.value >= 90 ? '#10b981' : 
                         hoveredState.value >= 80 ? '#84cc16' : 
                         hoveredState.value >= 70 ? '#eab308' : '#f97316' 
                }}>
                  {hoveredState.value}%
                </div>
                <div className="text-xs text-slate-400">repayment rate</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3 bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm font-medium text-center mb-3">Repayment Rate Scale</div>
          <div className="relative">
            <div className="h-4 rounded-full flex overflow-hidden shadow-md">
              {['#f97316', '#fbbf24', '#eab308', '#a3e635', '#84cc16', '#22c55e', '#10b981', '#059669'].map((color, i) => (
                <div key={i} className="flex-1 transition-all hover:scale-105" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="absolute -top-1 left-0 w-1 h-6 bg-slate-900 dark:bg-white rounded-full" />
            <div className="absolute -top-1 right-0 w-1 h-6 bg-slate-900 dark:bg-white rounded-full" />
          </div>
          <div className="flex items-center justify-between text-xs font-medium px-1">
            <span className="text-orange-600">60% Poor</span>
            <span className="text-yellow-600">75% Average</span>
            <span className="text-green-600">100% Excellent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
