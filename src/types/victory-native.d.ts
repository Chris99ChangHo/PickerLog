// Minimal typing shim for victory-native to satisfy strict TS
// and allow named import of VictoryPie.

declare module 'victory-native' {
  import * as React from 'react';

  export type Datum = { x?: string | number; y?: number };

  export interface VictoryPieProps {
    data?: Datum[];
    innerRadius?: number;
    padAngle?: number;
    colorScale?: string[] | string;
    labels?: false | ((args: { datum: Datum }) => string | number | null | undefined);
    labelRadius?: number;
    style?: any;
    standalone?: boolean;
  }

  export const VictoryPie: React.ComponentType<VictoryPieProps>;
}

