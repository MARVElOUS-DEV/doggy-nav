import { useState } from 'react';
import { Dropdown, Avatar as ArcoAvatar, Button, Image, Menu } from '@arco-design/web-react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { authStateAtom, authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types';

interface UserAvatarProps {
  size?: number;
  className?: string;
  asMenuItems?: boolean;
}

export default function UserAvatar({ size = 40, className = '', asMenuItems = false }: UserAvatarProps) {
  const { t } = useTranslation('translation');
  const [authState] = useAtom(authStateAtom);
  const [, dispatchAuth] = useAtom(authActionsAtom);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Failed to logout', error);
    }
    dispatchAuth({ type: 'LOGOUT' });
    setDropdownVisible(false);
    window.location.href = '/';
  };

  const handleProfile = () => {
    setDropdownVisible(false);
    router.push('/profile');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const isAuthed = authState.isAuthenticated && !!authState.user;
  const user = authState.user as User | undefined;

  // Build menu items for use in both dropdown and inline menu modes
  const menuItems = isAuthed && user ? (
    <>
      <Menu.Item key="profile" onClick={handleProfile}>
        <div className="flex items-center justify-between py-1">
          <span className="mr-3 text-theme-foreground">{t('profile')}</span>
          <i className="iconfont icon-user text-lg text-theme-muted-foreground"></i>
        </div>
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        <div className="flex items-center justify-between py-1">
          <span className="mr-3 text-theme-foreground">{t('sign_out')}</span>
          <i className="iconfont icon-logout text-lg text-theme-muted-foreground"></i>
        </div>
      </Menu.Item>
    </>
  ) : (
    <Menu.Item key="login" onClick={handleLogin}>
      <div className="flex items-center justify-between py-1">
        <span className="mr-3 text-theme-foreground">{t('sign_in')}</span>
        <i className="iconfont icon-user text-lg text-theme-muted-foreground"></i>
      </div>
    </Menu.Item>
  );

  if (asMenuItems) {
    return <>{menuItems}</>;
  }

  if (!isAuthed || !user) {
    return (
      <Button
        type="primary"
        size="small"
        onClick={handleLogin}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none rounded-full"
      >
        {t('sign_in')}
      </Button>
    );
  }

  const dropdownMenu = (
    <Menu style={{ minWidth: 180 }}>
      <Menu.Item key="user" disabled>
        <div className="flex flex-col">
          <span className="font-medium text-theme-foreground">{user.username}</span>
          {user.email && (
            <span className="text-sm text-theme-muted-foreground">{user.email}</span>
          )}
        </div>
      </Menu.Item>
      {menuItems}
    </Menu>
  );

  const getAvatarText = (user: User): string => {
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return user.email ? user.email.charAt(0).toUpperCase() : 'U';
  };

  const getAvatarColors = (username: string): string => {
    // Generate consistent colors based on username
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-orange-500 to-orange-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-red-500 to-red-600',
      'bg-gradient-to-r from-yellow-500 to-yellow-600',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Dropdown
      droplist={dropdownMenu}
      trigger="click"
      position="bottom"
      popupVisible={dropdownVisible}
      onVisibleChange={setDropdownVisible}
    >
      <div className={`cursor-pointer ${className}`}>
        {user.avatar ? (
          <ArcoAvatar
            size={size}
            className="ring-2 ring-white ring-opacity-50 shadow-md"
          >
            <Image src={user.avatar} alt={user.username} preview={false} width={40} height={40} />
          </ArcoAvatar>
        ) : (
          <div
            className={`${getAvatarColors(user.username)} rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 ring-2 ring-white ring-opacity-50`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
          >
            {getAvatarText(user)}
          </div>
        )}
      </div>
    </Dropdown>
  );
}