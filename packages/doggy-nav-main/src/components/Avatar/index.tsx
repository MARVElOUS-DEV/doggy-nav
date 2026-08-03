import { ReactNode, useState } from 'react';
import { Dropdown, Avatar as ArcoAvatar, Button, Image, Menu } from '@arco-design/web-react';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { authStateAtom, authActionsAtom } from '@/store/store';
import api from '@/utils/api';
import { useTranslation } from 'react-i18next';
import { User } from '@/types';

interface UserAvatarProps {
  size?: number;
  className?: string;
  asMenuItems?: boolean;
}

export default function UserAvatar({
  size = 40,
  className = '',
  asMenuItems = false,
}: UserAvatarProps) {
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
    void router.push({
      pathname: '/login',
      query: { redirect: router.asPath },
    });
  };

  const isAuthed = authState.isAuthenticated && !!authState.user;
  const user = authState.user as User | undefined;

  const renderMenuItemContent = (label: string, icon: ReactNode) => (
    <div className="flex items-center py-1">
      <span className="mr-3 text-theme-muted-foreground">{icon}</span>
      <span className="text-theme-foreground">{label}</span>
    </div>
  );

  // Build menu items for use in both dropdown and inline menu modes
  const menuItems =
    isAuthed && user ? (
      <>
        <Menu.Item key="profile" onClick={handleProfile}>
          {renderMenuItemContent(
            t('profile'),
            <UserIcon className="text-lg text-theme-muted-foreground" size={18} />
          )}
        </Menu.Item>
        <Menu.Item key="logout" onClick={handleLogout}>
          {renderMenuItemContent(
            t('sign_out'),
            <LogOut className="text-lg text-theme-muted-foreground" size={18} />
          )}
        </Menu.Item>
      </>
    ) : (
      <Menu.Item key="login" onClick={handleLogin}>
        {renderMenuItemContent(
          t('sign_in'),
          <UserIcon className="text-lg text-theme-muted-foreground" size={18} />
        )}
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
        className="rounded-full border-none bg-theme-primary text-theme-primary-foreground hover:opacity-90"
      >
        {t('sign_in')}
      </Button>
    );
  }

  const dropdownMenu = (
    <Menu style={{ minWidth: 180 }}>
      <Menu.Item key="user" disabled>
        <span className="font-medium text-theme-foreground">{user.username}</span>
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
          <ArcoAvatar size={size} className="ring-2 ring-white ring-opacity-50 shadow-md">
            <Image
              className="rounded-full"
              src={user.avatar}
              alt={user.username}
              preview={false}
              width={40}
              height={40}
            />
          </ArcoAvatar>
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-theme-primary font-semibold text-theme-primary-foreground shadow-md ring-2 ring-theme-border transition-all duration-200 hover:shadow-lg"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
          >
            {getAvatarText(user)}
          </div>
        )}
      </div>
    </Dropdown>
  );
}
