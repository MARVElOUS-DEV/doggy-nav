import * as React from 'react';

interface ReactIfProps {
  condition: boolean;
  children: React.ReactNode;
}

const ReactIf: React.FC<ReactIfProps> = ({ condition, children }): JSX.Element | null => {
  if (condition) {
    return children as React.ReactElement;
  }
  return null;
};

interface ReactIfElseProps extends ReactIfProps {
  children: [React.ReactNode, React.ReactNode];
}

export const ReactIfElse: React.FC<ReactIfElseProps> = ({ condition, children, ...p }) => {
  const childElements: React.ReactElement[] = React.Children.map(
    children,
    (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { ...p });
      }
      return child as unknown as React.ReactElement;
    }
  ) || [];

  if (childElements.length !== 2) {
    return null;
  } else {
    return condition ? childElements[0] : childElements[1];
  }
};

export default ReactIf;
