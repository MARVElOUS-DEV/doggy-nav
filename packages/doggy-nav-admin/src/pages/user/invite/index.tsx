import TableCom from '@/components/TableCom';
import {
  API_INVITE_CODES_LIST,
  createInviteCodes,
  revokeInviteCode,
  updateInviteCode,
} from '@/services/api';
import { formatDateTime } from '@/utils/time';
import type { ProColumns } from '@ant-design/pro-table';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

interface InviteCodeRecord {
  id: string;
  code: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  allowedEmailDomain?: string | null;
  note?: string;
}

const InviteCodePage: React.FC = () => {
  const tableRef = useRef<any>();
  const [generateVisible, setGenerateVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<InviteCodeRecord | null>(null);
  const [filters, setFilters] = useState({
    code: '',
    active: undefined as boolean | undefined,
  });
  const [generateForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [recentCodes, setRecentCodes] = useState<
    Array<{ code: string; id: string }>
  >([]);

  const columns: ProColumns<InviteCodeRecord>[] = [
    {
      title: '邀请码',
      dataIndex: 'code',
      search: false,
      render: (_, record) => (
        <Tooltip title={record.code}>
          <Tag color="blue">{record.code}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '限制/已用',
      search: false,
      render: (_, record) => `${record.usedCount}/${record.usageLimit}`,
    },
    {
      title: '状态',
      dataIndex: 'active',
      search: false,
      render: (_, record) =>
        record.active ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag color="red">停用</Tag>
        ),
    },
    {
      title: '邮箱域名',
      dataIndex: 'allowedEmailDomain',
      search: false,
      renderText: (domain) => domain || '-',
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      search: false,
      renderText: (v) => formatDateTime(v),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      renderText: (v) => formatDateTime(v),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      search: false,
      renderText: (v) => formatDateTime(v),
    },
    {
      title: '备注',
      dataIndex: 'note',
      search: false,
      ellipsis: true,
      width: 160,
    },
  ];

  const handleGenerate = async (values: any) => {
    try {
      if (
        values.expiresAt &&
        typeof (values.expiresAt as any).toDate === 'function'
      ) {
        values.expiresAt = (values.expiresAt as any).toDate().toISOString();
      }
      const res = await createInviteCodes(values);
      const codes = res?.data?.codes || [];
      setRecentCodes(codes);
      message.success(`生成成功，共 ${codes.length} 个`);
      generateForm.resetFields();
      setGenerateVisible(false);
      tableRef.current?.reload?.();
    } catch (e: any) {
      message.error(e?.message || '生成失败');
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editRecord) return;
    try {
      if (
        values.expiresAt &&
        typeof (values.expiresAt as any).toDate === 'function'
      ) {
        values.expiresAt = (values.expiresAt as any).toDate().toISOString();
      }
      await updateInviteCode(editRecord.id, values);
      message.success('更新成功');
      editForm.resetFields();
      setEditRecord(null);
      tableRef.current?.reload?.();
    } catch (e: any) {
      message.error(e?.message || '更新失败');
    }
  };

  // Filters handled via toolbar; no extra summary bar needed

  return (
    <>
      <TableCom
        actionRef={tableRef}
        columns={columns}
        requestParams={{ url: API_INVITE_CODES_LIST, method: 'GET' }}
        defaultRequestData={{
          code: filters.code || undefined,
          active:
            typeof filters.active === 'boolean'
              ? String(filters.active)
              : undefined,
        }}
        toolbar={{
          actions: [
            <Input.Search
              key="search"
              allowClear
              placeholder="搜索邀请码"
              onSearch={(value) => {
                setFilters((prev) => ({ ...prev, code: value }));
                setTimeout(() => tableRef.current?.reload?.(), 0);
              }}
              style={{ width: 200 }}
            />,
            <Switch
              key="status"
              checkedChildren="仅启用"
              unCheckedChildren="全部"
              onChange={(checked) => {
                setFilters((prev) => ({
                  ...prev,
                  active: checked ? true : undefined,
                }));
                setTimeout(() => tableRef.current?.reload?.(), 0);
              }}
            />,
            <Button
              key="gen"
              type="primary"
              onClick={() => setGenerateVisible(true)}
            >
              批量生成
            </Button>,
          ],
        }}
        renderOptions={(_, record) => [
          <a
            key="edit"
            onClick={() => {
              setEditRecord(record);
              editForm.setFieldsValue({
                usageLimit: record.usageLimit,
                active: record.active,
                allowedEmailDomain: record.allowedEmailDomain || undefined,
                note: record.note,
              });
            }}
          >
            编辑
          </a>,
          <a
            key="revoke"
            onClick={async () => {
              try {
                await revokeInviteCode(record.id);
                message.success('操作成功');
                tableRef.current?.reload?.();
              } catch (e: any) {
                message.error(e?.message || '操作失败');
              }
            }}
          >
            {record.active ? '停用' : '已停用'}
          </a>,
        ]}
      />

      <Modal
        open={generateVisible}
        title="生成邀请码"
        onCancel={() => setGenerateVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={generateForm}
          layout="vertical"
          initialValues={{ count: 1, usageLimit: 1 }}
          onFinish={handleGenerate}
        >
          <Form.Item label="生成数量" name="count" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="使用次数"
            name="usageLimit"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="过期时间" name="expiresAt">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="邮箱域名限制" name="allowedEmailDomain">
            <Input placeholder="例如 example.com，可选" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
          {recentCodes.length > 0 && (
            <Form.Item label="最近生成">
              <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                {recentCodes.map((item) => item.code).join(', ')}
              </Typography.Paragraph>
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button onClick={() => setGenerateVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                生成
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!editRecord}
        title="编辑邀请码"
        onCancel={() => setEditRecord(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="使用次数上限" name="usageLimit">
            <InputNumber
              min={editRecord?.usedCount || 0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="是否启用" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="过期时间" name="expiresAt">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="邮箱域名限制" name="allowedEmailDomain">
            <Input placeholder="例如 example.com，可选" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="可选备注信息" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setEditRecord(null)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InviteCodePage;
