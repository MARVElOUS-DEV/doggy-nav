import { useTranslation } from 'react-i18next';

export default function CustomerServiceBtn(props: any) {
  const { t } = useTranslation();
  return <div {...props}>{t('customer_service')}</div>;
}
