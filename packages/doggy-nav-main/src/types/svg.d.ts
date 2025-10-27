declare module '*.svg' {
  import * as React from 'react';
  const ReactComponent: React.FC<
    React.SVGProps<SVGSVGElement> & { title?: string; className?: string }
  >;
  export default ReactComponent;
}
