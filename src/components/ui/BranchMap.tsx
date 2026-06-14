import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface BranchLocalData {
  name: string;
  location: string;
  attendance: number;
  growth: number;
  lat: number;
  lng: number;
}

interface BranchMapProps {
  data: BranchLocalData[];
}

export function BranchMap({ data }: BranchMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    svg.selectAll('*').remove();

    // Approximate bounding box for Nigeria to map coords
    // Longitude: 2.6 to 14.6
    // Latitude: 4.2 to 13.9
    // Expanded slightly for padding
    const xScale = d3.scaleLinear()
      .domain([2.0, 15.0])
      .range([100, width - 100]);

    const yScale = d3.scaleLinear()
      .domain([4.0, 14.0])
      .range([height - 100, 50]);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.attendance) || 1])
      .range([8, 40]);

    const mapGroup = svg.append('g');

    // Add subtle grid to represent geography
    const gridLng = d3.range(3, 15, 2);
    const gridLat = d3.range(4, 14, 2);

    mapGroup.selectAll('.grid-x')
      .data(gridLng)
      .enter().append('line')
      .attr('class', 'grid-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 50)
      .attr('y2', height - 100)
      .attr('stroke', 'rgba(255,255,255,0.05)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    mapGroup.selectAll('.grid-y')
      .data(gridLat)
      .enter().append('line')
      .attr('class', 'grid-y')
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('x1', 100)
      .attr('x2', width - 100)
      .attr('stroke', 'rgba(255,255,255,0.05)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 4');

    const nodes = mapGroup.selectAll('.branch-node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'branch-node')
      .attr('transform', d => `translate(${xScale(d.lng)}, ${yScale(d.lat)})`)
      .style('cursor', 'pointer');
      
    // Add glowing background for active branches
    nodes.filter(d => d.attendance > 0).append('circle')
      .attr('r', d => sizeScale(d.attendance) + 15)
      .attr('fill', 'url(#glow)')
      .attr('opacity', 0.5);

    // D3 glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const radialGradient = defs.append('radialGradient')
      .attr('id', 'glow-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#34d399').attr('stop-opacity', 0.4);
    radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#34d399').attr('stop-opacity', 0);

    nodes.filter(d => d.attendance > 0).append('circle')
      .attr('r', d => sizeScale(d.attendance) + 20)
      .attr('fill', 'url(#glow-gradient)');

    // Main circle
    nodes.append('circle')
      .attr('r', d => d.attendance === 0 ? 10 : sizeScale(d.attendance))
      .attr('fill', d => d.attendance === 0 ? '#334155' : '#34d399')
      .attr('opacity', 0.8)
      .attr('stroke', d => d.attendance === 0 ? '#475569' : '#10b981')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.3s ease');

    // Inner dot
    nodes.append('circle')
      .attr('r', 4)
      .attr('fill', '#fff');

    const labels = nodes.append('g');

    labels.append('text')
      .text(d => d.location)
      .attr('y', d => d.attendance === 0 ? -18 : -sizeScale(d.attendance) - 10)
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .style('text-shadow', '0px 2px 4px rgba(0,0,0,0.8)');

    labels.append('text')
      .text(d => d.attendance > 0 ? `${d.attendance.toLocaleString()} members` : 'Pending Setup')
      .attr('y', d => d.attendance === 0 ? 22 : sizeScale(d.attendance) + 20)
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.attendance === 0 ? '#94a3b8' : '#a7f3d0')
      .attr('font-size', '12px')
      .style('text-shadow', '0px 1px 3px rgba(0,0,0,0.8)');

    // Simple connection lines representing network relationship with HQ (Uyo)
    const hq = data.find(d => d.location.includes('HQ'));
    if (hq) {
      const hqNode = [hq.lng, hq.lat];
      const connectingLines = mapGroup.selectAll('.network-link')
        .data(data.filter(d => d.location !== hq.location))
        .enter()
        .insert('line', '.branch-node')
        .attr('class', 'network-link')
        .attr('x1', xScale(hqNode[0]))
        .attr('y1', yScale(hqNode[1]))
        .attr('x2', d => xScale(d.lng))
        .attr('y2', d => yScale(d.lat))
        .attr('stroke', d => d.attendance > 0 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255,255,255,0.1)')
        .attr('stroke-width', d => d.attendance > 0 ? 2 : 1)
        .attr('stroke-dasharray', d => d.attendance > 0 ? 'none' : '4 4');
    }

  }, [data]);

  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center relative">
      <svg ref={svgRef} className="w-full h-full drop-shadow-2xl" />
      <div className="absolute top-4 right-4 flex gap-4 text-xs bg-[#0B0118]/80 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-md">
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 opacity-80 shadow-[0_0_10px_#34d399]"></span>
            <span className="text-white">Active Branch</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-600 opacity-80 border border-slate-500"></span>
            <span className="text-white/60">Pending Setup</span>
         </div>
      </div>
    </div>
  );
}
