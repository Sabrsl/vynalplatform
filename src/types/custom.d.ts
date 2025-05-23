declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  interface AutoSizerProps {
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: { height: number; width: number }) => void;
    style?: React.CSSProperties;
    children: (size: { height: number; width: number }) => React.ReactNode;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
} 