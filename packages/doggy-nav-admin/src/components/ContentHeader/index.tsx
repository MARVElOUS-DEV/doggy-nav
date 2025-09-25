import React from 'react';
import { Space, Button, Badge, Avatar, Dropdown, Menu, Typography, Row, Col } from 'antd';
import {
  HomeOutlined, SearchOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import './style.less';

const { Title, Text } = Typography;

interface ContentHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode[];
  showBreadcrumb?: boolean;
  showUserMenu?: boolean;
  showSearch?: boolean;
  onMenuToggle?: () => void;
  collapsed?: boolean;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  title = '狗头导航',
  subtitle = '导航网站管理系统',
  actions = [],
  showBreadcrumb = true,
  showUserMenu = true,
  showSearch = true,
  onMenuToggle,
  collapsed = false
}) => {
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人资料
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="content-header">
      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
        <Col>
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={onMenuToggle}
              className="menu-toggle-btn"
            />
            <div className="header-title-section">
              {showBreadcrumb && (
                <div className="breadcrumb">
                  <HomeOutlined style={{ marginRight: 8 }} />
                  <span>首页</span>
                  {title && <span style={{ margin: '0 8px' }}>›</span>}
                  <span>{title}</span>
                </div>
              )}
              <div className="title-section">
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {title}
                </Title>
                {subtitle && <Text type="secondary" style={{ marginLeft: 8 }}>{subtitle}</Text>}
              </div>
            </div>
          </div>
        </Col>

        <Col>
          <div className="header-right">
            <Space size="middle">
              {showSearch && (
                <Button
                  icon={<SearchOutlined />}
                  type="text"
                  size="large"
                  className="search-btn"
                />
              )}

              <Badge count={3} dot>
                <Button
                  icon={<BellOutlined />}
                  type="text"
                  size="large"
                  className="notification-btn"
                />
              </Badge>

              {actions && actions.length > 0 && (
                <Space>
                  {actions}
                </Space>
              )}

              {showUserMenu && (
                <Dropdown menu={{ items: [
                  {
                    key: 'profile',
                    label: '个人资料',
                    icon: <UserOutlined />,
                  },
                  {
                    key: 'settings',
                    label: '设置',
                    icon: <SettingOutlined />,
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'logout',
                    label: '退出登录',
                    icon: <LogoutOutlined />,
                    danger: true,
                  }
                ]}} trigger={['click']} placement="bottomRight">
                  <div className="user-menu-trigger">
                    <Avatar
                      size="large"
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: '#1890ff',
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                    />
                    <span style={{ cursor: 'pointer' }}>管理员</span>
                  </div>
                </Dropdown>
              )}
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ContentHeader;