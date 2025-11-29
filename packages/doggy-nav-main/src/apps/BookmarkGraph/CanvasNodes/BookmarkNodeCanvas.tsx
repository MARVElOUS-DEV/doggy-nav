import React, { useState } from 'react';
import { Group, Rect, Text, Label, Tag } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import type { BookmarkGraphNode } from '../utils/bookmarkParser';
import { BOOKMARK_SIZE } from '../BookmarkGraphCanvasConfig';

interface BookmarkNodeCanvasProps {
  node: BookmarkGraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  onDragStart?: (nodeId: string, evt: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (nodeId: string, evt: KonvaEventObject<DragEvent>) => void;
  onClick: (nodeId: string) => void;
  onDelete?: () => void;
  onRename?: () => void;
}

const BookmarkNodeCanvas: React.FC<BookmarkNodeCanvasProps> = React.memo(({
  node,
  x,
  y,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
  onDelete,
  onRename,
}) => {
  const [hoveredBtn, setHoveredBtn] = useState<'rename' | 'delete' | null>(null);

  const handleDragStart = React.useCallback((evt: KonvaEventObject<DragEvent>) => {
      if (onDragStart) onDragStart(node.id, evt);
  }, [node.id, onDragStart]);

  const handleDragEnd = React.useCallback((evt: KonvaEventObject<DragEvent>) => {
      onDragEnd(node.id, evt);
  }, [node.id, onDragEnd]);

  const handleClick = React.useCallback(() => {
      onClick(node.id);
  }, [node.id, onClick]);

  const renderTooltip = (text: string, tx: number, ty: number) => (
    <Label x={tx} y={ty} listening={false}>
      <Tag
        fill="#1F2937"
        pointerDirection="down"
        pointerWidth={8}
        pointerHeight={5}
        cornerRadius={4}
        opacity={0.9}
      />
      <Text text={text} fontSize={11} padding={6} fill="#F9FAFB" />
    </Label>
  );

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <Rect
        width={BOOKMARK_SIZE.width}
        height={BOOKMARK_SIZE.height}
        cornerRadius={8}
        fill="#FFFFFF"
        stroke={isSelected ? '#3B82F6' : '#94A3B8'}
        strokeWidth={2}
      />
      <Text
        x={12}
        y={10}
        text={node.data.label}
        fontSize={14}
        fontStyle="bold"
        fill="#111827"
        width={BOOKMARK_SIZE.width - 70}
        wrap="none"
        ellipsis
      />
      {node.data.url && (
        <Text
          x={12}
          y={32}
          text={node.data.url}
          fontSize={11}
          fill="#4B5563"
          width={BOOKMARK_SIZE.width - 70}
          wrap="none"
          ellipsis
        />
      )}

      {/* Rename Button */}
      {isSelected && onRename && (
        <Group
          x={BOOKMARK_SIZE.width - 50}
          y={6}
          onClick={(e) => {
            e.cancelBubble = true;
            onRename();
          }}
          onMouseEnter={() => setHoveredBtn('rename')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Rect width={20} height={20} cornerRadius={4} fill="transparent" />
          <Text x={4} y={4} text="✎" fontSize={14} fill="#9CA3AF" />
        </Group>
      )}

      {/* Delete Button */}
      {isSelected && onDelete && (
        <Group
          x={BOOKMARK_SIZE.width - 26}
          y={6}
          onClick={(e) => {
            e.cancelBubble = true;
            onDelete();
          }}
          onMouseEnter={() => setHoveredBtn('delete')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Rect width={20} height={20} cornerRadius={4} fill="transparent" />
          <Text x={4} y={4} text="✕" fontSize={14} fill="#EF4444" />
        </Group>
      )}

      {/* Tooltips */}
      {hoveredBtn === 'rename' && renderTooltip('Rename', BOOKMARK_SIZE.width - 40, -5)}
      {hoveredBtn === 'delete' && renderTooltip('Delete', BOOKMARK_SIZE.width - 16, -5)}
    </Group>
  );
});

export default BookmarkNodeCanvas;
