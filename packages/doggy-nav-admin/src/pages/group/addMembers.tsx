import { addGroupMembers } from '@/services/api';
import request from '@/utils/request';
import { ProTable } from '@ant-design/pro-table';
import { Button, Modal, Space, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const AddMembers: React.FC<{
  groupId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ groupId, open, onClose, onSuccess }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const queryRef = useRef<any>({});

  useEffect(() => {
    if (!open) setSelectedRowKeys([]);
  }, [open]);

  const handleAddSelected = async () => {
    if (!selectedRowKeys.length) return onClose();
    setSaving(true);
    try {
      await addGroupMembers(groupId, selectedRowKeys);
      message.success('已添加所选成员');
      onSuccess?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Bulk add by filter removed; only add selected userIds

  return (
    <Modal
      title="批量添加成员"
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleAddSelected}>
            添加所选
          </Button>
        </Space>
      }
      width={800}
      destroyOnHidden
    >
      <ProTable
        rowKey="id"
        search={{ labelWidth: 60 }}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          queryRef.current = params;
          const res: any = await request({
            method: 'GET',
            url: '/api/user',
            params,
          });
          const list = Array.isArray(res?.list)
            ? res.list
            : Array.isArray(res?.data?.list)
              ? res.data.list
              : [];
          const total =
            typeof res?.total === 'number'
              ? res.total
              : typeof res?.data?.total === 'number'
                ? res.data.total
                : 0;
          return { data: list, total } as any;
        }}
        columns={[
          { title: '账号', dataIndex: 'account' },
          { title: 'Email', dataIndex: 'email' },
          {
            title: '用户组',
            dataIndex: 'groups',
            hideInSearch: true,
            render: (groups: string[]) =>
              Array.isArray(groups) && groups.length ? groups.join(', ') : '-',
          },
          {
            title: '状态',
            dataIndex: 'status',
            valueEnum: { 1: { text: '启用' }, 0: { text: '禁用' } },
          },
        ]}
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        toolBarRender={false}
      />
    </Modal>
  );
};

export default AddMembers;
