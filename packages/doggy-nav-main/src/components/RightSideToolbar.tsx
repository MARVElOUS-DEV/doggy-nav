import { Tooltip, Button, BackTop as ArcoBackTop } from '@arco-design/web-react';
import { IconPlus, IconArrowUp } from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';
import CustomerServiceBtn from './CustomerServiceBtn';
import { useTranslation } from 'react-i18next';

export default function RightSideToolbar(props: any) {
  const { t } = useTranslation();
  const router = useRouter();

  const recommend = () => {
    router.push('/recommend');
  };

  return (
    <div className="toolbar fixed right-5 bottom-5 flex flex-col items-end z-50">
      {/* Recommend Site Button - at the top of the stack (highest) */}
      <div className="mb-3 transition-all duration-300 hover:scale-110">
        <Tooltip content={t('add_site')} position="left">
          <Button
            type="primary"
            shape="circle"
            icon={<IconPlus />}
            onClick={recommend}
            className="shadow-lg hover:shadow-xl"
            size="large"
          />
        </Tooltip>
      </div>

      {/* Customer Service Button - in the middle */}
      <div className="mb-3 transition-all duration-300 hover:scale-110">
        <CustomerServiceBtn {...props} />
      </div>

      {/* Back to Top Button - at the bottom of the stack (lowest) */}
      <div className="transition-all duration-300 hover:scale-110">
        <Tooltip content={t('back_to_top')} position="left">
          <ArcoBackTop>
            <Button
              type="primary"
              shape="circle"
              icon={<IconArrowUp />}
              className="shadow-lg hover:shadow-xl"
              size="large"
            />
          </ArcoBackTop>
        </Tooltip>
      </div>
    </div>
  );
}
