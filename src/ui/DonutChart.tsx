// src/ui/DonutChart.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

export type DonutSlice = {
  value: number;
  color: string;
  label?: string;
};

export interface DonutChartProps {
  data: DonutSlice[];
  size?: number; // px
  innerRadiusRatio?: number; // 0..1
  showPercentLabels?: boolean;
  labelColor?: string;
  labelFontSize?: number;
  labelMinPercent?: number; // do not render labels below this percent
}

const deg2rad = (deg: number) => (deg * Math.PI) / 180;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = deg2rad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, rOuter, startAngle);
  const outerEnd = polarToCartesian(cx, cy, rOuter, endAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, endAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  innerRadiusRatio = 0.6,
  showPercentLabels = false,
  labelColor = '#FFFFFF',
  labelFontSize = 12,
  labelMinPercent = 8,
}) => {
  const total = data.reduce((s, d) => s + Math.max(0, d.value || 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = Math.max(0, Math.min(rOuter - 2, rOuter * innerRadiusRatio));

  if (total <= 0) {
    return <View />;
  }

  let cursor = -90; // start at top (12 o'clock)
  const paths = data.map((d, i) => {
    const frac = (Math.max(0, d.value || 0) / total) || 0;
    const sweep = frac * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    if (sweep <= 0) return null;
    const dPath = describeDonutSegment(cx, cy, rOuter, rInner, start, end);
    return <Path key={i} d={dPath} fill={d.color} />;
  });

  // Optional percentage labels at arc centroids
  cursor = -90;
  const labels = showPercentLabels
    ? data.map((d, i) => {
        const frac = (Math.max(0, d.value || 0) / total) || 0;
        const pct = Math.round(frac * 100);
        const sweep = frac * 360;
        const start = cursor;
        const end = cursor + sweep;
        cursor = end;
        if (pct < labelMinPercent || sweep <= 0) return null;
        const mid = start + sweep / 2;
        const rMid = (rInner + rOuter) / 2;
        const { x, y } = polarToCartesian(cx, cy, rMid, mid);
        return (
          <SvgText
            key={`label-${i}`}
            x={x}
            y={y}
            fill={labelColor}
            fontSize={labelFontSize}
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`${pct}%`}
          </SvgText>
        );
      })
    : null;

  return (
    <Svg width={size} height={size}>
      {paths}
      {labels}
    </Svg>
  );
};

export default DonutChart;
