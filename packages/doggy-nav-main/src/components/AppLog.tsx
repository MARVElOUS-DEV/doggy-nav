import { Modal } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

interface AppLogProps {
  show: boolean;
  onCloseLog: () => void;
}

export default function AppLog({ show, onCloseLog }: AppLogProps) {
  const { t } = useTranslation();
  const logs = [
    {
      time: '2022-04-13',
      content: '【新增】server支持初始化数据库 & 支持 yarn workspace monorepo',
    },
    {
      time: '2022-04-14',
      content: '【新增】现在支持多级菜单，递归实现',
    },
    {
      time: '2022-04-16',
      content: '【新增】server支持导入chrome json格式书签',
    },
    {
      time: '2022-04-19',
      content: '【新增】支持一键docker部署',
    },
    {
      time: '2022-04-22',
      content: '【新增】更换背景，修复主题',
    },
  ];

  return (
    <Modal
      title={t('update_log')}
      visible={show}
      onCancel={onCloseLog}
      footer={null}
    >
      <ul>
        {logs.map((log) => (
          <li key={log.time} className="list-disc leading-8 text-base">
            {log.content}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
