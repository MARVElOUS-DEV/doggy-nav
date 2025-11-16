import { Tooltip, Button, BackTop } from '@arco-design/web-react';
import { IconPlus, IconArrowUp, IconCustomerService } from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';

export default function RightSideToolbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [popupVisible, setPopupVisible] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const recommend = () => {
    router.push('/recommend');
  };

  const handleCustomerService = () => {
    window.open('https://github.com/MARVElOUS-DEV/doggy-nav', '_blank');
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Set show timeout for 1 second
    hoverTimeoutRef.current = setTimeout(() => {
      setPopupVisible(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setPopupVisible(false);
    }, 3000);
  };

  const handlePopupMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setPopupVisible(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const glassButtonStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  };

  const renderMenu = () => (
    <div
      className="flex flex-col space-y-3 p-3 rounded-xl animate-in slide-in-from-bottom-2 fade-in duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.4)',
      }}
      onMouseEnter={handlePopupMouseEnter}
      onMouseLeave={handlePopupMouseLeave}
    >
      <div className="transition-all duration-300 hover:scale-110">
        <Tooltip content={t('add_site')} position="left">
          <Button
            shape="circle"
            icon={<IconPlus />}
            onClick={recommend}
            className="border-0 text-white hover:text-blue-200 transition-all duration-300"
            style={glassButtonStyle}
            size="large"
          />
        </Tooltip>
      </div>

      <div className="transition-all duration-300 hover:scale-110">
        <Tooltip content={t('feedback')} position="left">
          <Button
            shape="circle"
            icon={<IconCustomerService />}
            onClick={handleCustomerService}
            className="border-0 text-white hover:text-blue-200 transition-all duration-300"
            style={glassButtonStyle}
            size="large"
          />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div className="fixed right-5 bottom-5 z-50">
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Popup Menu */}
        {popupVisible && <div className="absolute bottom-20 right-0 mb-2">{renderMenu()}</div>}

        {/* BackTop component */}
        <BackTop
          visibleHeight={30}
          easing={'quintIn'}
          duration={200}
          target={() => document.getElementById('doggy-content-area') || window}
        >
          <div className="transition-all duration-300 hover:scale-110">
            <Tooltip content={t('back_to_top')} position="left">
              <Button
                shape="circle"
                icon={<IconArrowUp />}
                className="border-0 text-white hover:text-blue-200 transition-all duration-300"
                style={glassButtonStyle}
                size="large"
              />
            </Tooltip>
          </div>
        </BackTop>
      </div>
    </div>
  );
}
