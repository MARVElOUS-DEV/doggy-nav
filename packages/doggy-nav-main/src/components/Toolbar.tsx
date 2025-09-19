import { Tooltip, Button, BackTop as ArcoBackTop } from '@arco-design/web-react';
import { useRouter } from 'next/navigation';
import CustomerServiceBtn from './CustomerServiceBtn';
import { useTranslation } from 'react-i18next';

export default function Toolbar(props: any) {
  const { t } = useTranslation();
  const router = useRouter();

  const recommend = () => {
    router.push('/recommend');
  };

  return (
    <div className="toolbar">
      <div className="fixed right-5 bottom-[170px]">
        <Tooltip content={t('add_site')} position="left">
          <Button type="primary" shape="circle" icon={<i className="el-icon-plus" />} onClick={recommend} />
        </Tooltip>
      </div>
      <div className="fixed right-5 bottom-[100px]">
        <CustomerServiceBtn {...props} />
      </div>
      <div className="fixed right-5 bottom-[30px]">
        <Tooltip content={t('back_to_top')} position="left">
          <ArcoBackTop>
            <Button type="primary" shape="circle" icon={<i className="el-icon-arrow-up" />} />
          </ArcoBackTop>
        </Tooltip>
      </div>
    </div>
  );
}
