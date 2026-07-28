import { Popover, Tag } from 'antd';
import './NavTagList.less';

const TAG_COLORS = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'purple',
];

interface NavTagListProps {
  tags?: string[];
  maxVisible?: number;
}

function getTagColor(label: string) {
  const colorIndex = [...label].reduce(
    (total, character) => total + character.codePointAt(0)!,
    0,
  );
  return TAG_COLORS[colorIndex % TAG_COLORS.length];
}

function renderTag(label: string, index: number) {
  return (
    <Tag key={`${label}-${index}`} color={getTagColor(label)}>
      {label}
    </Tag>
  );
}

export default function NavTagList({
  tags = [],
  maxVisible = 3,
}: NavTagListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const trigger = (
    <div className="nav-tag-list-trigger">{visibleTags.map(renderTag)}</div>
  );

  if (tags.length <= maxVisible) {
    return trigger;
  }

  return (
    <Popover
      content={
        <div className="nav-tag-list-popover">{tags.map(renderTag)}</div>
      }
      placement="topLeft"
      styles={{
        root: {
          maxWidth: 'min(520px, calc(100vw - 32px))',
        },
        body: {
          maxWidth: '100%',
          overflow: 'hidden',
          background: '#fff',
        },
      }}
    >
      {trigger}
    </Popover>
  );
}
