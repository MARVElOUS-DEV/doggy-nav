import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { request as umiRequest } from '@umijs/max';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';

type Affiche = {
  id: string;
  text: string;
  linkHref?: string | null;
  linkText?: string | null;
  linkTarget?: string | null;
  active: boolean;
  order?: number | null;
};

const AffichePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Affiche> | null>(null);
  const [form] = Form.useForm<Affiche>();

  const columns: ProColumns<Affiche>[] = useMemo(
    () => [
      { title: '内容', dataIndex: 'text', ellipsis: true },
      {
        title: '链接文本',
        dataIndex: 'linkText',
        ellipsis: true,
      },
      {
        title: '链接地址',
        dataIndex: 'linkHref',
        ellipsis: true,
      },
      {
        title: '启用',
        dataIndex: 'active',
        render: (_, record) => (
          <Switch
            size="small"
            checked={record.active}
            onChange={async (checked) => {
              try {
                await umiRequest('/api/affiches', {
                  method: 'PUT',
                  data: { id: record.id, active: checked },
                });
                message.success('状态已更新');
                actionRef.current?.reload();
              } catch (e: any) {
                message.error(e?.message || '更新失败');
              }
            }}
          />
        ),
      },
      {
        title: '排序',
        dataIndex: 'order',
        render: (_, r) => r.order ?? '-',
      },
      {
        title: '操作',
        valueType: 'option',
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  ...record,
                  linkHref: record.linkHref ?? undefined,
                  linkText: record.linkText ?? undefined,
                  linkTarget: record.linkTarget ?? undefined,
                } as any);
                setOpen(true);
              }}
            >
              编辑
            </Button>
            <Button
              size="small"
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认删除该公告?',
                  onOk: async () => {
                    await umiRequest('/api/affiches', {
                      method: 'DELETE',
                      data: { id: record.id },
                    });
                    message.success('已删除');
                    actionRef.current?.reload();
                  },
                });
              }}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [form],
  );

  return (
    <PageContainer
      extra={[
        <Button
          key="new"
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          新建公告
        </Button>,
      ]}
    >
      <ProTable<Affiche>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await umiRequest('/api/affiches', {
            method: 'GET',
            params: { pageSize: params.pageSize, pageNumber: params.current },
          });
          return {
            data: res?.data?.data || [],
            total: res?.data?.total || 0,
            success: true,
          } as any;
        }}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        open={open}
        title={editing?.id ? '编辑公告' : '新建公告'}
        width={520}
        onClose={() => setOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={async () => {
                const values = await form.validateFields();
                const payload: any = {
                  text: values.text,
                  linkHref: values.linkHref || undefined,
                  linkText: values.linkText || undefined,
                  linkTarget: values.linkTarget || undefined,
                  active: values.active,
                  order: values.order,
                };
                if (editing?.id) {
                  await umiRequest('/api/affiches', {
                    method: 'PUT',
                    data: { id: editing.id, ...payload },
                  });
                  message.success('已更新');
                } else {
                  await umiRequest('/api/affiches', {
                    method: 'POST',
                    data: payload,
                  });
                  message.success('已创建');
                }
                setOpen(false);
                actionRef.current?.reload();
              }}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ active: true }}>
          <Form.Item
            name="text"
            label="公告内容"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入公告内容" />
          </Form.Item>
          <Form.Item name="linkText" label="链接文本">
            <Input placeholder="如：前往查看" />
          </Form.Item>
          <Form.Item
            name="linkHref"
            label="链接地址"
            extra="可为站内路径或完整 URL"
          >
            <Input placeholder="如：/recommend 或 https://example.com" />
          </Form.Item>
          <Form.Item
            name="linkTarget"
            label="打开方式"
            extra="留空则使用默认窗口"
          >
            <Input placeholder="如：_blank 或 _self" />
          </Form.Item>
          <Form.Item name="order" label="排序值">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="数字越小越靠前"
            />
          </Form.Item>
          <Form.Item name="active" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

export default AffichePage;
