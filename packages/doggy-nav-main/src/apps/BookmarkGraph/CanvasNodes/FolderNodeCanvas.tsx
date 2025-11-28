import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import type { BookmarkGraphNode } from '../utils/bookmarkParser';
import { FOLDER_DEFAULT_SIZE } from '../BookmarkGraphCanvasConfig';

interface FolderNodeCanvasProps {
  node: BookmarkGraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  onDragStart?: (evt: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (evt: KonvaEventObject<DragEvent>) => void;
  onClick: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isReparentSource?: boolean;
  onJunctionClick?: () => void;
}

const FolderNodeCanvas: React.FC<FolderNodeCanvasProps> = ({
  node,
  x,
  y,
  isSelected,
  onDragStart,
  onDragEnd,
  onClick,
  page,
  totalPages,
  onPageChange,
  isReparentSource,
  onJunctionClick,
}) => {
  const width =
    node.style && typeof node.style.width === 'number'
      ? (node.style.width as number)
      : FOLDER_DEFAULT_SIZE.width;
  const height =
    node.style && typeof node.style.height === 'number'
      ? (node.style.height as number)
      : FOLDER_DEFAULT_SIZE.height;

  const currentPage = page ?? 0;
  const pages = totalPages ?? 1;
  const showPager = pages > 1 && onPageChange;

  return (
    <Group x={x} y={y} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}>
      <Rect
        width={width}
        height={height}
        cornerRadius={8}
        stroke={isSelected ? '#2563EB' : '#94A3B8'}
        strokeWidth={3}
        dash={[8, 4]}
        fill="rgba(249,250,251,0.8)"
      />
      <Rect
        width={width}
        height={32}
        cornerRadius={[8, 8, 0, 0]}
        fill={isSelected ? '#BFDBFE' : '#E5EDFF'}
      />
      <Text
        x={8}
        y={8}
        text={node.data.label}
        fontSize={14}
        fontStyle="bold"
        fill="#111827"
        width={width - 180}
        ellipsis
      />
      <Text x={8} y={40} text="Drag bookmarks here" fontSize={11} fill="#9CA3AF" />

      {onJunctionClick && (
        <Group x={width - 164} y={6}>
          <Rect
            width={20}
            height={20}
            cornerRadius={10}
            fill={isReparentSource ? '#2563EB' : '#E5E7EB'}
            stroke={isReparentSource ? '#1D4ED8' : '#94A3B8'}
            strokeWidth={1.5}
            onClick={(e) => {
              e.cancelBubble = true;
              onJunctionClick();
            }}
          />
          <Text
            x={5}
            y={4}
            text="↪"
            fontSize={12}
            fill={isReparentSource ? '#FFFFFF' : '#1F2937'}
            listening={false}
          />
        </Group>
      )}

      {showPager && (
        <Group x={width - 132} y={4}>
          <Rect
            width={120}
            height={24}
            cornerRadius={12}
            fill="rgba(15,23,42,0.04)"
            stroke="#CBD5E1"
            strokeWidth={1}
          />
          <Text
            x={8}
            y={5}
            text="<"
            fontSize={12}
            fill={currentPage > 0 ? '#1F2937' : '#9CA3AF'}
            onClick={(e) => {
              e.cancelBubble = true;
              if (currentPage > 0 && onPageChange) {
                onPageChange(currentPage - 1);
              }
            }}
          />
          <Text
            x={32}
            y={5}
            text={`${currentPage + 1} / ${pages}`}
            fontSize={11}
            fill="#4B5563"
          />
          <Text
            x={96}
            y={5}
            text=">"
            fontSize={12}
            fill={currentPage < pages - 1 ? '#1F2937' : '#9CA3AF'}
            onClick={(e) => {
              e.cancelBubble = true;
              if (currentPage < pages - 1 && onPageChange) {
                onPageChange(currentPage + 1);
              }
            }}
          />
        </Group>
      )}
    </Group>
  );
};

export default FolderNodeCanvas;
