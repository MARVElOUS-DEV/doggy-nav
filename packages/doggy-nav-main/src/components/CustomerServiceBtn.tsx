import { useTranslation } from 'react-i18next';

export default function CustomerServiceBtn(props: any) {
  const { t } = useTranslation();
  const {onShowLog} = props;
  return <div onClick={onShowLog}>{t('customer_service')}</div>;
}
