import { useState } from 'react';
import { Dropdown, Avatar as ArcoAvatar, Button } from '@arco-design/web-react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { authStateAtom, authActionsAtom } from '@/store/store';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types';

interface UserAvatarProps {
  size?: number;
  className?: string;
}

export default function UserAvatar({ size = 40, className = '' }: UserAvatarProps) {
  const { t } = useTranslation('translation');
  const [authState] = useAtom(authStateAtom);
  const [, dispatchAuth] = useAtom(authActionsAtom);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    dispatchAuth({ type: 'LOGOUT' });
    setDropdownVisible(false);
    router.push('/');
  };

  const handleProfile = () => {
    setDropdownVisible(false);
    router.push('/profile');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <Button
        type="primary"
        size="small"
        onClick={handleLogin}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none rounded-full"
      >
        Sign In
      </Button>
    );
  }

  const user = authState.user;

  const dropdownMenu = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px]">
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="font-medium text-gray-900">{user.username}</div>
        {user.email && (
          <div className="text-sm text-gray-500">{user.email}</div>
        )}
      </div>
      <div className="py-2">
        <button
          onClick={handleProfile}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center"
        >
          <i className="iconfont icon-user mr-2 text-gray-400"></i>
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center"
        >
          <i className="iconfont icon-logout mr-2 text-gray-400"></i>
          Sign Out
        </button>
      </div>
    </div>
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
            src={user.avatar}
            alt={user.username}
            className="ring-2 ring-white ring-opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
          />
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