import { defaultHeaders } from '@/utils/request';
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { request as umiRequest } from '@umijs/max';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useRef, useState } from 'react';

type AiProvider = {
  id: string;
  name: string;
  provider: 'openai-compatible' | 'mimo';
  baseURL: string;
  model: string;
  active: boolean;
  apiKeySet: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AiProviderForm = {
  name: string;
  provider: 'openai-compatible' | 'mimo';
  baseURL: string;
  model: string;
  apiKey?: string;
  active: boolean;
};

const providerOptions = [
  { label: 'OpenAI Compatible', value: 'openai-compatible' },
  { label: 'Mimo', value: 'mimo' },
];

const defaultTestPrompt = 'Reply with ok and the model name you are using.';

const AiProviderPage = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm<AiProviderForm>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<AiProvider | null>(null);
  const [testPrompt, setTestPrompt] = useState(defaultTestPrompt);
  const [testLoading, setTestLoading] = useState(false);
  const [testOutput, setTestOutput] = useState('');

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      provider: 'openai-compatible',
      baseURL: 'https://api.openai.com/v1',
      active: false,
    } as AiProviderForm);
    setOpen(true);
  };

  const openEdit = (record: AiProvider) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      provider: record.provider,
      baseURL: record.baseURL,
      model: record.model,
      active: record.active,
      apiKey: '',
    });
    setOpen(true);
  };

  const saveProvider = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        ...values,
        apiKey: values.apiKey?.trim() || undefined,
      };
      if (editing?.id) {
        await umiRequest('/api/ai-providers', {
          method: 'PUT',
          data: { id: editing.id, ...payload },
          headers: defaultHeaders(),
        });
        message.success('Provider 已更新');
      } else {
        await umiRequest('/api/ai-providers', {
          method: 'POST',
          data: payload,
          headers: defaultHeaders(),
        });
        message.success('Provider 已创建');
      }
      setOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.data?.msg || error?.message || '保存 Provider 失败');
    } finally {
      setSaving(false);
    }
  };

  const activateProvider = async (record: AiProvider) => {
    await umiRequest(`/api/ai-providers/${record.id}/activate`, {
      method: 'POST',
      headers: defaultHeaders(),
    });
    message.success('已设为当前 AI Provider');
    actionRef.current?.reload();
  };

  const deleteProvider = (record: AiProvider) => {
    Modal.confirm({
      title: '确认删除该 Provider?',
      content: record.active
        ? '该 Provider 当前正在使用。删除后主站 AI 调用将回退到环境变量配置。'
        : '删除后无法恢复该配置。',
      okButtonProps: { danger: true },
      onOk: async () => {
        await umiRequest('/api/ai-providers', {
          method: 'DELETE',
          data: { id: record.id },
          headers: defaultHeaders(),
        });
        message.success('已删除');
        actionRef.current?.reload();
      },
    });
  };

  const runTest = async () => {
    if (!testing) return;
    setTestLoading(true);
    setTestOutput('');
    try {
      const res = await umiRequest(`/api/ai-providers/${testing.id}/test`, {
        method: 'POST',
        data: {
          messages: [
            { role: 'user', content: testPrompt.trim() || defaultTestPrompt },
          ],
          max_tokens: 128,
        },
        headers: defaultHeaders(),
      });
      const content =
        res?.data?.choices?.[0]?.message?.content ||
        'Provider returned no content.';
      setTestOutput(content);
    } catch (error: any) {
      message.error(error?.data?.msg || error?.message || 'Provider 测试失败');
    } finally {
      setTestLoading(false);
    }
  };

  const columns: ProColumns<AiProvider>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{record.name}</Typography.Text>
          {record.active ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              当前使用
            </Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'provider',
      width: 160,
      valueEnum: {
        'openai-compatible': { text: 'OpenAI Compatible' },
        mimo: { text: 'Mimo' },
      },
    },
    {
      title: 'Base URL',
      dataIndex: 'baseURL',
      ellipsis: true,
      copyable: true,
    },
    {
      title: '模型',
      dataIndex: 'model',
      width: 180,
      copyable: true,
    },
    {
      title: '密钥',
      dataIndex: 'apiKeySet',
      width: 110,
      render: (_, record) =>
        record.apiKeySet ? <Tag color="blue">已配置</Tag> : <Tag>未配置</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      render: (_, record) => (
        <Space>
          {!record.active ? (
            <Button size="small" onClick={() => activateProvider(record)}>
              启用
            </Button>
          ) : null}
          <Button
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => setTesting(record)}
          >
            测试
          </Button>
          <Button size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button size="small" danger onClick={() => deleteProvider(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{ title: false }}
      extra={[
        <Button
          key="new"
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
        >
          新建 Provider
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="主站 AI 调用使用当前启用的 Provider"
      />

      <ProTable<AiProvider>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await umiRequest('/api/ai-providers', {
            method: 'GET',
            params: { pageSize: params.pageSize, pageNumber: params.current },
            headers: defaultHeaders(),
          });
          return {
            data: res?.data?.data || [],
            total: res?.data?.total || 0,
            success: true,
          };
        }}
        pagination={{ pageSize: 10 }}
        toolBarRender={false}
      />

      <Drawer
        open={open}
        title={editing ? '编辑 Provider' : '新建 Provider'}
        width={560}
        onClose={() => setOpen(false)}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={saveProvider}>
              保存
            </Button>
          </Space>
        }
      >
        <Form<AiProviderForm>
          form={form}
          layout="vertical"
          initialValues={{ provider: 'openai-compatible', active: false }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如: OpenAI Production" />
          </Form.Item>
          <Form.Item
            name="provider"
            label="Provider 类型"
            rules={[{ required: true, message: '请选择 Provider 类型' }]}
          >
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item
            name="baseURL"
            label="Base URL"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item
            name="model"
            label="模型"
            rules={[{ required: true, message: '请输入模型' }]}
          >
            <Input placeholder="gpt-4o-mini" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            extra={editing?.apiKeySet ? '留空则保持当前密钥不变。' : undefined}
            rules={[
              {
                validator: async (_, value) => {
                  if (!editing?.id && !String(value || '').trim()) {
                    throw new Error('请输入 API Key');
                  }
                },
              },
            ]}
          >
            <Input.Password
              placeholder={editing?.apiKeySet ? '保持不变' : '请输入 API Key'}
            />
          </Form.Item>
          <Form.Item name="active" label="设为当前使用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        open={Boolean(testing)}
        title={testing ? `测试 ${testing.name}` : '测试 Provider'}
        onCancel={() => {
          setTesting(null);
          setTestOutput('');
          setTestPrompt(defaultTestPrompt);
        }}
        onOk={runTest}
        confirmLoading={testLoading}
        okText="运行测试"
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            rows={4}
            value={testPrompt}
            onChange={(event) => setTestPrompt(event.target.value)}
          />
          {testOutput ? (
            <Typography.Paragraph
              copyable
              style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}
            >
              {testOutput}
            </Typography.Paragraph>
          ) : null}
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default AiProviderPage;
