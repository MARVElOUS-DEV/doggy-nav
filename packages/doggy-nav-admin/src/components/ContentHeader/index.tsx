import {
  BellOutlined,
  CrownOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Avatar,
  Badge,
  Button,
  Col,
  Dropdown,
  message,
  Row,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import apiRequest from '../../utils/request';
import './style.less';

const loginPath = '/user/login';

const { Title, Text } = Typography;

interface ContentHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode[];
  showUserMenu?: boolean;
  showSearch?: boolean;
  currentUser?: any;
}

const ContentHeader: React.FC<ContentHeaderProps> = ({
  title = '狗狗导航',
  subtitle = '导航网站管理系统',
  actions = [],
  showUserMenu = true,
  showSearch = true,
  currentUser,
}) => {
  const handleLogout = async () => {
    try {
      await apiRequest({ url: '/api/auth/logout', method: 'POST' });
    } catch {}
    message.success('退出登录成功');
    history.push(loginPath);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // Navigate to profile page
        break;
      case 'settings':
        // Navigate to settings page
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <div className="content-header">
      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
        <Col>
          <div className="header-left">
            <div
              className="logo-container"
              onClick={() => history.push('/nav/admin')}
              style={{ cursor: 'pointer', marginRight: 16 }}
            >
              <img
                src="/logo-nav-white.png"
                alt="狗狗导航"
                style={{
                  height: '42px',
                  width: '120px',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div className="header-title-section">
              <div className="title-section">
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {title}
                </Title>
                {subtitle && (
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {subtitle}
                  </Text>
                )}
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

              {actions && actions.length > 0 && <Space>{actions}</Space>}

              {showUserMenu && (
                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleMenuClick,
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <div className="user-menu-trigger">
                    <Avatar
                      size="large"
                      icon={
                        currentUser?.roles?.includes('sysadmin') ? (
                          <CrownOutlined />
                        ) : (
                          <UserOutlined />
                        )
                      }
                      style={{
                        backgroundColor: currentUser?.roles?.includes(
                          'sysadmin',
                        )
                          ? '#f5222d'
                          : '#1890ff',
                        cursor: 'pointer',
                        marginRight: 8,
                        border: currentUser?.roles?.includes('sysadmin')
                          ? '2px solid #ffd700'
                          : 'none',
                      }}
                    />
                    <span style={{ cursor: 'pointer' }}>
                      {currentUser?.roles?.includes('sysadmin')
                        ? '超级管理员'
                        : '管理员'}
                    </span>
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
