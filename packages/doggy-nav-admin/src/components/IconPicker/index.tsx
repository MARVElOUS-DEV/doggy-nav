import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Tabs, Popover, Button } from 'antd';
import type { InputRef, TabsProps } from 'antd';
// Arco Design Icons
import {
  IconHome,
  IconApps,
  IconList,
  IconStar,
  IconHeart,
  IconFolder,
  IconFile,
  IconImage,
  IconVideoCamera,
  IconMusic,
  IconBook,
  IconBug,
  IconCode,
  IconSettings,
  IconTool,
  IconStorage,
  IconCloud,
  IconMobile,
  IconDesktop,
  IconPublic,
  IconEmail,
  IconUser,
  IconUserGroup,
  IconSafe,
  IconLock,
  IconInfoCircle,
  IconQuestionCircle,
  IconExclamationCircle,
  IconNotification,
  IconCalendar,
  IconClockCircle,
  IconLocation,
  IconTag,
  IconTags,
  IconInteraction,
  IconFaceSmileFill,
  IconFaceMehFill,
  IconFaceFrownFill,
} from '@arco-design/web-react/icon';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';

// Popular Arco Design icons for categories
const arcoDesignIcons = [
  'IconHome',
  'IconApps',
  'IconList',
  'IconStar',
  'IconHeart',
  'IconFolder',
  'IconFile',
  'IconImage',
  'IconVideoCamera',
  'IconMusic',
  'IconBook',
  'IconBug',
  'IconCode',
  'IconSettings',
  'IconTool',
  'IconStorage',
  'IconCloud',
  'IconMobile',
  'IconDesktop',
  'IconPublic',
  'IconEmail',
  'IconUser',
  'IconUserGroup',
  'IconSafe',
  'IconLock',
  'IconInfoCircle',
  'IconQuestionCircle',
  'IconExclamationCircle',
  'IconNotification',
  'IconCalendar',
  'IconClockCircle',
  'IconLocation',
  'IconTag',
  'IconTags',
  'IconInteraction',
  'IconFaceSmileFill',
  'IconFaceMehFill',
  'IconFaceFrownFill',
];

// Mapping Arco icon names to actual components
const arcoIconMap = {
  IconHome,
  IconApps,
  IconList,
  IconStar,
  IconHeart,
  IconFolder,
  IconFile,
  IconImage,
  IconVideoCamera,
  IconMusic,
  IconBook,
  IconBug,
  IconCode,
  IconSettings,
  IconTool,
  IconStorage,
  IconCloud,
  IconMobile,
  IconDesktop,
  IconPublic,
  IconEmail,
  IconUser,
  IconUserGroup,
  IconSafe,
  IconLock,
  IconInfoCircle,
  IconQuestionCircle,
  IconExclamationCircle,
  IconNotification,
  IconCalendar,
  IconClockCircle,
  IconLocation,
  IconTag,
  IconTags,
  IconInteraction,
  IconFaceSmileFill,
  IconFaceMehFill,
  IconFaceFrownFill,
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

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = '点击选择图标',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ant');
  const searchInputRef = useRef<InputRef>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredArcoIcons = arcoDesignIcons.filter(icon =>
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

  const renderIconPreview = (icon: string, isEmoji: boolean = false, iconType: 'ant' | 'arco' = 'ant') => {
    if (isEmoji) {
      return (
        <div className="icon-picker-item" onClick={() => handleIconSelect(`type:emoji_${icon}`)}>
          <span className="icon-emoji" style={{ fontSize: '18px' }}>
            {icon}
          </span>
        </div>
      );
    }

if (iconType === 'arco') {
      const IconComponent = arcoIconMap[icon as keyof typeof arcoIconMap];
      if (IconComponent) {
        return (
          <div className="icon-picker-item" onClick={() => handleIconSelect(`type:arco_${icon}`)}>
            <div className="icon-arco">
              <IconComponent style={{ fontSize: '18px' }} />
            </div>
          </div>
        );
      }
    }

    return null;
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'arco',
      label: 'Arco图标',
      children: (
        <div className="icon-picker-grid">
          {filteredArcoIcons.length > 0 ? (
            filteredArcoIcons.map(icon => renderIconPreview(icon, false, 'arco'))
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
      const isEmoji = value?.startsWith('type:emoji_');
      const iconType = value?.startsWith('type:arco_') ? 'arco' : 'ant';

      content = (
        <div className="icon-picker-trigger">
          {isEmoji ? (
            <span className="selected-emoji" style={{ fontSize: '18px' }}>
              {value?.replace('type:emoji_', '')}
            </span>
          ) : (
            (() => {
              if (iconType === 'arco') {
                const iconName = value?.replace('type:arco_', '') || '';
                const IconComponent = arcoIconMap[iconName as keyof typeof arcoIconMap];
                if (IconComponent) {
                  return <IconComponent style={{ fontSize: '18px' }} />;
                }
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
                  {value?.startsWith('type:emoji_') ? (
                    <span className="preview-emoji" style={{ fontSize: '32px' }}>
                      {value?.replace('type:emoji_', '')}
                    </span>
                  ) : (
                    (() => {
                      const iconType = value?.startsWith('type:arco_') ? 'arco' : 'ant';
                      if (iconType === 'arco') {
                        const iconName = value?.replace('type:arco_', '') || '';
                        const IconComponent = arcoIconMap[iconName as keyof typeof arcoIconMap];
                        if (IconComponent) {
                          return <IconComponent style={{ fontSize: '32px' }} />;
                        }
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