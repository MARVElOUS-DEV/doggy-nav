import TableCom from '@/components/TableCom';
import AddOrEdit from '@/pages/client/addOrEdit';
import {
  ApiOutlined,
  CopyOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { ActionType } from '@ant-design/pro-table';
import { Access, useRequest } from '@umijs/max';
import { Button, message, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useRef, useState } from 'react';

const { Text } = Typography;

interface ApplicationItem {
  id: string;
  name: string;
  description?: string;
  clientSecret: string;
  userId: {
    id: string;
    username: string;
    email: string;
  };
  isActive: boolean;
  allowedOrigins: string[];
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const ClientPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<ApplicationItem[]>([]);
  const [id, setId] = useState<string>('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { loading: deleteLoading, run: batchDelete } = useRequest(
    (ids: string[]) => {
      return {
        method: 'DELETE',
        url: `/api/application/batch`,
        data: { ids },
      };
    },
    {
      manual: true,
      onSuccess: () => {
        setSelectedRows([]);
        actionRef?.current?.reloadAndRest?.();
      },
    },
  );

  const { loading: regenerateLoading, run: regenerateSecret } = useRequest(
    (id: string) => {
      return {
        method: 'POST',
        url: `/api/application/${id}/regenerate-secret`,
      };
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('Client Secret 已重新生成');
        actionRef?.current?.reload?.();
      },
    },
  );

  const { loading: revokeLoading, run: revokeApplication } = useRequest(
    (id: string) => {
      return {
        method: 'POST',
        url: `/api/application/${id}/revoke`,
      };
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('应用已撤销');
        actionRef?.current?.reload?.();
      },
    },
  );

  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '温馨提示',
      icon: <ExclamationCircleFilled />,
      content: `确定要删除所选应用吗？此操作不可恢复。`,
      onOk() {
        batchDelete(ids);
      },
    });
  };

  const handleRegenerate = (record: ApplicationItem) => {
    Modal.confirm({
      title: '重新生成 Client Secret',
      icon: <ExclamationCircleFilled />,
      content: `确定要重新生成 "${record.name}" 的 Client Secret 吗？旧的密钥将失效。`,
      onOk() {
        regenerateSecret(record.id);
      },
    });
  };

  const handleRevoke = (record: ApplicationItem) => {
    Modal.confirm({
      title: '撤销应用',
      icon: <ExclamationCircleFilled />,
      content: `确定要撤销应用 "${record.name}" 吗？应用将无法继续使用。`,
      onOk() {
        revokeApplication(record.id);
      },
    });
  };

  const handleEdit = (record: ApplicationItem) => {
    setId(record.id);
    setDrawerVisible(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  const maskSecret = (secret: string) => {
    if (!secret) return '';
    return secret.substring(0, 8) + '***' + secret.substring(secret.length - 8);
  };

  const renderActions = (text: string, record: ApplicationItem) => (
    <Space>
      <Button type="link" onClick={() => handleEdit(record)}>
        编辑
      </Button>
      <Button
        type="link"
        loading={regenerateLoading}
        onClick={() => handleRegenerate(record)}
        disabled={!record.isActive}
      >
        重新生成
      </Button>
      <Button
        type="link"
        danger
        loading={revokeLoading}
        onClick={() => handleRevoke(record)}
        disabled={!record.isActive}
      >
        撤销
      </Button>
    </Space>
  );

  const columns: any[] = [
    {
      title: '应用名称',
      dataIndex: 'name',
      render: (name: string, record: ApplicationItem) => (
        <Space>
          <ApiOutlined />
          <Text strong>{name}</Text>
          {!record.isActive && <Tag color="red">已撤销</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: 'Client Secret',
      dataIndex: 'clientSecret',
      hideInSearch: true,
      render: (secret: string) => (
        <Space>
          <Text code style={{ fontSize: '12px' }}>
            {maskSecret(secret)}
          </Text>
          <Tooltip title="复制完整密钥">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(secret)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '所有者',
      dataIndex: ['userId', 'username'],
      render: (username: string, record: ApplicationItem) => (
        <Space direction="vertical" size={0}>
          <Text>{username}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.userId?.email}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      valueEnum: {
        true: {
          text: '正常',
          status: 'Success',
        },
        false: {
          text: '已撤销',
          status: 'Error',
        },
      },
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      hideInSearch: true,
      render: (date: string) =>
        date ? new Date(date).toLocaleString() : '从未使用',
    },
    {
      title: '创建时间',
      hideInSearch: true,
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      valueType: 'option',
      render: renderActions,
    },
  ];

  const { loading, run } = useRequest(
    (params) => {
      return {
        method: 'GET',
        url: '/api/application/list',
        params,
      };
    },
    {
      manual: true,
    },
  );

  return (
    <PageContainer header={{ title: false }}>
      {drawerVisible ? (
        <AddOrEdit
          setDrawerVisible={setDrawerVisible}
          id={id}
          actionRef={actionRef}
        />
      ) : null}
      <TableCom
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        loading={loading}
        rowKey="id"
        search={{
          labelWidth: 60,
        }}
        toolBarRender={() => [
          <Access accessible key="add">
            <Button
              key="add"
              type="primary"
              icon={<ApiOutlined />}
              onClick={() => {
                setId('');
                setDrawerVisible(true);
              }}
            >
              注册应用
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          const result = await run(params);
          return {
            data: result?.applications || [],
            total: result?.total || 0,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRows?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRows.length}</a>{' '}
              项&nbsp;&nbsp;
            </div>
          }
        >
          <Access accessible key="delete">
            <Button
              type="primary"
              danger
              loading={deleteLoading}
              onClick={async () => {
                handleDelete(selectedRows.map((item) => item.id));
              }}
            >
              批量删除
            </Button>
          </Access>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default ClientPage;
