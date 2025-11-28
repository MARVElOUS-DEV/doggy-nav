import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import type { BookmarkGraphNode } from '../utils/bookmarkParser';
import { BOOKMARK_SIZE } from '../BookmarkGraphCanvasConfig';

interface BookmarkNodeCanvasProps {
  node: BookmarkGraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  onDragStart?: (evt: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (evt: KonvaEventObject<DragEvent>) => void;
  onClick: () => void;
}

const BookmarkNodeCanvas: React.FC<BookmarkNodeCanvasProps> = ({
  node,
  x,
  y,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <Rect
        width={BOOKMARK_SIZE.width}
        height={BOOKMARK_SIZE.height}
        cornerRadius={8}
        fill="#FFFFFF"
        stroke={isSelected ? '#3B82F6' : '#E5E7EB'}
        strokeWidth={2}
      />
      <Text
        x={12}
        y={10}
        text={node.data.label}
        fontSize={14}
        fontStyle="bold"
        fill="#111827"
        width={BOOKMARK_SIZE.width - 24}
        wrap="none"
        ellipsis
      />
      {node.data.url && (
        <Text
          x={12}
          y={32}
          text={node.data.url}
          fontSize={11}
          fill="#6B7280"
          width={BOOKMARK_SIZE.width - 24}
          wrap="none"
          ellipsis
        />
      )}
    </Group>
  );
};

export default BookmarkNodeCanvas;
