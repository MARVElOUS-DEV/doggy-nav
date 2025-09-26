import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Tabs, Popover, Button } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  StarOutlined,
  HeartOutlined,
  FolderOutlined,
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  BookOutlined,
  ReadOutlined,
  CodeOutlined,
  SettingOutlined,
  ToolOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MobileOutlined,
  DesktopOutlined,
  GlobalOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  LockOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  HeartTwoTone,
  StarTwoTone,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
} from '@ant-design/icons';

// Popular Ant Design icons for categories
const antDesignIcons = [
  'HomeOutlined',
  'AppstoreOutlined',
  'UnorderedListOutlined',
  'StarOutlined',
  'HeartOutlined',
  'FolderOutlined',
  'FileOutlined',
  'PictureOutlined',
  'VideoCameraOutlined',
  'AudioOutlined',
  'BookOutlined',
  'ReadOutlined',
  'CodeOutlined',
  'SettingOutlined',
  'ToolOutlined',
  'DatabaseOutlined',
  'CloudOutlined',
  'MobileOutlined',
  'DesktopOutlined',
  'GlobalOutlined',
  'MailOutlined',
  'UserOutlined',
  'TeamOutlined',
  'SafetyOutlined',
  'LockOutlined',
  'InfoCircleOutlined',
  'QuestionCircleOutlined',
  'WarningOutlined',
  'BellOutlined',
  'CalendarOutlined',
  'ClockCircleOutlined',
  'EnvironmentOutlined',
  'ShopOutlined',
  'ShoppingCartOutlined',
  'DollarOutlined',
  'HeartTwoTone',
  'StarTwoTone',
  'SmileOutlined',
  'FrownOutlined',
  'MehOutlined',
];

// Mapping icon names to actual components
const antIconMap = {
  HomeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  StarOutlined,
  HeartOutlined,
  FolderOutlined,
  FileOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  BookOutlined,
  ReadOutlined,
  CodeOutlined,
  SettingOutlined,
  ToolOutlined,
  DatabaseOutlined,
  CloudOutlined,
  MobileOutlined,
  DesktopOutlined,
  GlobalOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  LockOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  HeartTwoTone,
  StarTwoTone,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
};

// Popular emojis for categories
const emojiCategories = [
  // Technology & Development
  ['💻', '🖥️', '📱', '⌨️', '🖱️', '🔌', '💾', '📊', '📈', '🎯'],
  // Design & Creative
  ['🎨', '🖌️', '✏️', '📸', '🎭', '🎪', '🎼', '🎸', '🎹', '🎺'],
  // Business & Office
  ['💼', '🏢', '📋', '📁', '📑', '📝', '🗂️', '📎', '📌', '📍'],
  // Communication
  ['📞', '📧', '✉️', '📨', '📢', '📡', '🔔', '📣', '💬', '💭'],
  // Social & People
  ['👥', '👤', '👪', '👫', '👬', '👭', '🧑‍🤝‍🧑', '🤝', '👋', '👏'],
  // Media & Entertainment
  ['🎬', '🎞️', '🎪', '🎨', '🎭', '🎮', '🎯', '🎲', '🎳', '🎸'],
  // Education & Learning
  ['📚', '📖', '📝', '🎓', '🏫', '🔬', '🔭', '🧪', '⚗️', '🧬'],
  // Food & Dining
  ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈'],
  // Travel & Places
  ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒'],
  // Animals & Nature
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
  // Symbols & Objects
  ['⭐', '✨', '💫', '🌟', '⚡', '🔥', '💥', '✅', '❌', '⭕'],
];

const flatEmojis = emojiCategories.flat();

interface IconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Dynamically import Ant Design icons
const getIconComponent = (iconName: string) => {
  try {
    // This would be dynamically imported, but for now we'll use a simple approach
    return React.createElement('span', { className: 'anticon', style: { fontSize: '18px' } }, iconName);
  } catch (error) {
    return null;
  }
};

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = '点击选择图标',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ant');
  const searchInputRef = useRef<Input>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredAntIcons = antDesignIcons.filter(icon =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmojis = flatEmojis.filter(emoji =>
    emoji.includes(searchTerm)
  );

  const handleIconSelect = (icon: string) => {
    onChange?.(icon);
    setOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange?.('');
  };

  const renderIconPreview = (icon: string, isEmoji: boolean = false) => {
    if (isEmoji) {
      return (
        <div className="icon-picker-item" onClick={() => handleIconSelect(icon)}>
          <span className="icon-emoji" style={{ fontSize: '18px' }}>
            {icon}
          </span>
        </div>
      );
    }

    const IconComponent = antIconMap[icon as keyof typeof antIconMap];
    if (IconComponent) {
      return (
        <div className="icon-picker-item" onClick={() => handleIconSelect(icon)}>
          <div className="icon-ant">
            <IconComponent style={{ fontSize: '18px' }} />
          </div>
        </div>
      );
    }

    return null;
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'ant',
      label: 'Ant图标',
      children: (
        <div className="icon-picker-grid">
          {filteredAntIcons.length > 0 ? (
            filteredAntIcons.map(icon => renderIconPreview(icon, false))
          ) : (
            <div className="no-results">没有找到匹配的图标</div>
          )}
        </div>
      ),
    },
    {
      key: 'emoji',
      label: 'Emoji表情',
      children: (
        <div className="icon-picker-grid">
          {filteredEmojis.length > 0 ? (
            filteredEmojis.map(emoji => renderIconPreview(emoji, true))
          ) : (
            <div className="no-results">没有找到匹配的表情</div>
          )}
        </div>
      ),
    },
    {
      key: 'categories',
      label: '分类表情',
      children: (
        <div className="emoji-categories">
          {emojiCategories.map((category, index) => (
            <div key={index} className="emoji-category">
              <div className="category-title">分类 {index + 1}</div>
              <div className="category-emojis">
                {category.map(emoji => renderIconPreview(emoji, true))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const renderTrigger = () => {
    let content;

    if (!value) {
      content = (
        <div className="icon-picker-trigger">
          <span className="placeholder">{placeholder}</span>
        </div>
      );
    } else {
      // Check if it's an emoji
      const isEmoji = flatEmojis.includes(value);
      content = (
        <div className="icon-picker-trigger">
          {isEmoji ? (
            <span className="selected-emoji" style={{ fontSize: '18px' }}>{value}</span>
          ) : (
            (() => {
              const IconComponent = antIconMap[value as keyof typeof antIconMap];
              if (IconComponent) {
                return <IconComponent style={{ fontSize: '18px' }} />;
              }
              return <span className="selected-icon">{value}</span>;
            })()
          )}
        </div>
      );
    }

    return (
      <Popover
        content={
          <div className="icon-picker-preview">
            {value ? (
              <>
                <div className="preview-title">当前选择：</div>
                <div className="preview-content">
                  {flatEmojis.includes(value) ? (
                    <span className="preview-emoji" style={{ fontSize: '32px' }}>{value}</span>
                  ) : (
                    (() => {
                      const IconComponent = antIconMap[value as keyof typeof antIconMap];
                      if (IconComponent) {
                        return <IconComponent style={{ fontSize: '32px' }} />;
                      }
                      return <span className="preview-icon">{value}</span>;
                    })()
                  )}
                </div>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleClear}
                  className="clear-button"
                >
                  清除
                </Button>
              </>
            ) : (
              <div className="preview-empty">未选择图标</div>
            )}
          </div>
        }
        trigger="hover"
        placement="top"
      >
        {content}
      </Popover>
    );
  };

  return (
    <>
      <div
        className={`icon-picker ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(true)}
      >
        {renderTrigger()}
      </div>

      <Modal
        title="选择图标"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={800}
        className="icon-picker-modal"
      >
        <div className="icon-picker-search">
          <Input
            ref={searchInputRef}
            placeholder="搜索图标或表情..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="icon-picker-tabs"
        />
      </Modal>
    </>
  );
};

export default IconPicker;