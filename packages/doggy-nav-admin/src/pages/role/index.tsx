import { PlusOutlined } from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Access, useRequest } from '@umijs/max';
import { Button, Modal, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import RoleModal from './modal';

const RolePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const { loading: deleteLoading, run: batchDelete } = useRequest(
    (ids: string[]) => ({ method: 'DELETE', url: '/api/roles', data: { ids } }),
    {
      manual: true,
      onSuccess: () => {
        setSelectedRows([]);
        actionRef.current?.reloadAndRest?.();
      },
    },
  );

  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '温馨提示',
      content: '确定要删除所选项吗？',
      onOk: () => batchDelete(ids),
    });
  };

  const columns: ProColumns[] = [
    { title: '标识', dataIndex: 'slug' },
    { title: '显示名称', dataIndex: 'displayName', hideInSearch: true },
    {
      title: '系统角色',
      dataIndex: 'isSystem',
      hideInSearch: true,
      renderText: (v) => (v ? '是' : '否'),
    },
    {
      title: '权限数',
      dataIndex: 'permissions',
      hideInSearch: true,
      render: (_, r: any) => (
        <Tag color="blue">
          {Array.isArray(r?.permissions) ? r.permissions.length : 0}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', hideInSearch: true },
    { title: '更新时间', dataIndex: 'updatedAt', hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record: any) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingId(record.id);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="text"
            loading={deleteLoading}
            danger
            onClick={() => handleDelete([record.id])}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const { loading, run } = useRequest(
    (params) => ({ method: 'GET', url: '/api/roles', params }),
    { manual: true },
  );

  return (
    <PageContainer header={{ title: false }}>
      {modalOpen ? (
        <RoleModal
          id={editingId}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingId(undefined);
          }}
          onOk={() => {
            setModalOpen(false);
            actionRef.current?.reloadAndRest?.();
          }}
        />
      ) : null}
      <ProTable
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        loading={loading}
        rowKey="id"
        search={{ labelWidth: 60 }}
        toolBarRender={() => [
          <Access accessible key="add">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingId(undefined);
                setModalOpen(true);
              }}
            >
              新建
            </Button>
          </Access>,
        ]}
        request={async (params) => {
          const res = await run(params);
          return { data: res?.data || [], total: res?.total || 0 } as any;
        }}
        columns={columns}
        rowSelection={{ onChange: (_k, rows) => setSelectedRows(rows) }}
      />
      {selectedRows?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> 项
            </div>
          }
        >
          <Access accessible key="delete">
            <Button
              type="primary"
              danger
              onClick={() => handleDelete(selectedRows.map((r) => r.id))}
            >
              批量删除
            </Button>
          </Access>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default RolePage;
