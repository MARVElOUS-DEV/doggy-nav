import React, { useState } from 'react';
import { Group, Rect, Text, Label, Tag } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import type { BookmarkGraphNode } from '../utils/bookmarkParser';
import { FOLDER_DEFAULT_SIZE } from '../BookmarkGraphCanvasConfig';

interface FolderNodeCanvasProps {
  node: BookmarkGraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  onDragStart?: (nodeId: string, evt: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (nodeId: string, evt: KonvaEventObject<DragEvent>) => void;
  onClick: (nodeId: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isReparentSource?: boolean;
  onJunctionClick?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onDoubleClick?: () => void;
}

const FolderNodeCanvas: React.FC<FolderNodeCanvasProps> = React.memo(
  ({
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
    onDelete,
    onRename,
    onDoubleClick,
  }) => {
    const [hoveredBtn, setHoveredBtn] = useState<'rename' | 'delete' | 'junction' | null>(null);

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

    // Layout Calculations
    const junctionX = (width - 20) / 2;
    
    // Pager (if visible) is at: x = width - 132 (width 120)
    // Right margin = 12
    const rightStart = showPager ? width - 132 - 12 : width - 12;
    
    const deleteX = rightStart - 24;
    const renameX = deleteX - 12 - 24; // 12px gap

    const handleDragStart = React.useCallback(
      (evt: KonvaEventObject<DragEvent>) => {
        if (onDragStart) onDragStart(node.id, evt);
      },
      [node.id, onDragStart]
    );

    const handleDragEnd = React.useCallback(
      (evt: KonvaEventObject<DragEvent>) => {
        onDragEnd(node.id, evt);
      },
      [node.id, onDragEnd]
    );

    const handleClick = React.useCallback(() => {
      onClick(node.id);
    }, [node.id, onClick]);

    const handleDblClick = React.useCallback((evt: KonvaEventObject<MouseEvent>) => {
      if (onDoubleClick) {
        // Stop event propagation so it doesn't trigger stage double clicks if any
        evt.cancelBubble = true;
        onDoubleClick();
      }
    }, [onDoubleClick]);

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
        onDblClick={handleDblClick}
      >
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
          width={junctionX - 16}
          ellipsis
        />
        <Text x={8} y={40} text="Drag bookmarks here" fontSize={11} fill="#9CA3AF" />

        {onJunctionClick && (
          <Group 
            x={junctionX} 
            y={6}
            onMouseEnter={() => setHoveredBtn('junction')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Rect
              width={20}
              height={20}
              cornerRadius={10}
              fill={isReparentSource ? '#2563EB' : '#E5E7EB'}
              stroke={isReparentSource ? '#1D4ED8' : '#94A3B8'}
              strokeWidth={1.5}
              onClick={(e: { cancelBubble: boolean }) => {
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

        {/* Rename Button */}
        {isSelected && onRename && (
          <Group
            x={renameX}
            y={4}
            onClick={(e) => {
              e.cancelBubble = true;
              onRename();
            }}
            onMouseEnter={() => setHoveredBtn('rename')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Rect width={24} height={24} cornerRadius={4} fill="transparent" />
            <Text x={4} y={4} text="✎" fontSize={16} fill="#4B5563" />
          </Group>
        )}

        {/* Delete Button */}
        {isSelected && onDelete && (
          <Group
            x={deleteX}
            y={4}
            onClick={(e) => {
              e.cancelBubble = true;
              onDelete();
            }}
            onMouseEnter={() => setHoveredBtn('delete')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Rect width={24} height={24} cornerRadius={4} fill="transparent" />
            <Text x={6} y={4} text="✕" fontSize={16} fill="#EF4444" />
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

        {/* Tooltips */}
        {hoveredBtn === 'junction' && renderTooltip('Reparent', junctionX + 10, -5)}
        {hoveredBtn === 'rename' && renderTooltip('Rename', renameX + 12, -5)}
        {hoveredBtn === 'delete' && renderTooltip('Delete', deleteX + 12, -5)}
      </Group>
    );
  }
);

export default FolderNodeCanvas;
