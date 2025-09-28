import { Tooltip, Button } from '@arco-design/web-react';
import { IconCustomerService } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

export default function CustomerServiceBtn(props: any) {
  const { t } = useTranslation();
  const {onShowLog} = props;
  return (
    <Tooltip content={t('customer_service')} position="left">
      <Button
        type="primary"
        shape="circle"
        icon={<IconCustomerService />}
        onClick={onShowLog}
        className="shadow-lg hover:shadow-xl"
        size="large"
      />
    </Tooltip>
  );
}
