import { defaultHeaders } from '@/utils/request';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { request as umiRequest } from '@umijs/max';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Typography,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';

type Prompt = {
  id: string;
  name: string;
  content: string;
  active: boolean;
};

const PromptPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Prompt> | null>(null);
  const [form] = Form.useForm();
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testOutput, setTestOutput] = useState('');

  const columns: ProColumns<Prompt>[] = useMemo(
    () => [
      { title: '名称', dataIndex: 'name' },
      {
        title: '内容',
        dataIndex: 'content',
        ellipsis: true,
        render: (_, r) => (
          <Typography.Paragraph
            copyable
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 0 }}
          >
            {r.content}
          </Typography.Paragraph>
        ),
      },
      {
        title: '启用',
        dataIndex: 'active',
        render: (_, r) =>
          r.active ? (
            <Typography.Text type="success">是</Typography.Text>
          ) : (
            '否'
          ),
      },
      {
        title: '操作',
        valueType: 'option',
        render: (_, r) => (
          <Space>
            {!r.active && (
              <Button
                size="small"
                onClick={async () => {
                  await umiRequest(`/api/prompts/${r.id}/activate`, {
                    method: 'POST',
                  });
                  message.success('已设为启用');
                  actionRef.current?.reload();
                }}
              >
                设为启用
              </Button>
            )}
            <Button
              size="small"
              onClick={() => {
                setEditing(r);
                form.setFieldsValue(r);
                setOpen(true);
              }}
            >
              编辑
            </Button>
            <Button
              size="small"
              danger
              onClick={async () => {
                Modal.confirm({
                  title: '确认删除该 Prompt?',
                  onOk: async () => {
                    await umiRequest('/api/prompts', {
                      method: 'DELETE',
                      data: { id: r.id },
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
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          新建 Prompt
        </Button>,
      ]}
    >
      <Card title="测试启用 Prompt" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            rows={4}
            placeholder="输入用户消息..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
          />
          <Space>
            <Button
              type="primary"
              loading={testLoading}
              onClick={async () => {
                setTestLoading(true);
                setTestOutput('');
                try {
                  const res = await umiRequest('/api/ai/chat', {
                    method: 'POST',
                    data: { messages: [{ role: 'user', content: testInput }] },
                    headers: defaultHeaders(),
                  });
                  const content = res?.choices?.[0]?.message?.content ?? '';
                  setTestOutput(content);
                } catch (e: any) {
                  message.error(e?.message || '请求失败');
                } finally {
                  setTestLoading(false);
                }
              }}
            >
              运行
            </Button>
            <Typography.Text type="secondary">
              调用 OpenAI 兼容接口 /api/ai/chat
            </Typography.Text>
          </Space>
          {testOutput && (
            <Card type="inner" title="输出">
              <Typography.Paragraph>{testOutput}</Typography.Paragraph>
            </Card>
          )}
        </Space>
      </Card>

      <ProTable<Prompt>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await umiRequest('/api/prompts', {
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
        title={editing?.id ? '编辑 Prompt' : '新建 Prompt'}
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
                if (editing?.id) {
                  await umiRequest('/api/prompts', {
                    method: 'PUT',
                    data: { id: editing.id, ...values },
                  });
                  message.success('已更新');
                } else {
                  await umiRequest('/api/prompts', {
                    method: 'POST',
                    data: values,
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
        <Form form={form} layout="vertical" initialValues={{ active: false }}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如: 默认提示词" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="系统提示词，将作为 system message 预置"
            />
          </Form.Item>
          <Form.Item name="active" label="设为启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

export default PromptPage;
