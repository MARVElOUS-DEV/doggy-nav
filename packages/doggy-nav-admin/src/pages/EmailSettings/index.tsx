import {
  getEmailSettings,
  testEmailSettings,
  updateEmailSettings,
} from '@/services/api';
import { PageContainer } from '@ant-design/pro-layout';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  Row,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface EmailSettingsForm {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  enableNotifications: boolean;
  adminEmails: string[];
}

export default function EmailSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [, setSettings] = useState<EmailSettingsForm | null>(null);
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getEmailSettings();
      if (response.data) {
        setSettings(response.data);
        setHasSettings(true);
        form.setFieldsValue(response.data);
      } else {
        setHasSettings(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('加载邮件设置失败');
    }
  };

  const handleSubmit = async (values: EmailSettingsForm) => {
    setLoading(true);
    try {
      if (hasSettings) {
        await updateEmailSettings(values);
      } else {
        await updateEmailSettings(values);
        setHasSettings(true);
      }
      message.success('邮件设置保存成功');
    } catch (error) {
      message.error('更新邮件设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    try {
      await testEmailSettings({});
      message.success('测试邮件发送成功');
    } catch (error) {
      message.error('发送测试邮件失败');
    } finally {
      setTestLoading(false);
    }
  };

  const adminEmails = Form.useWatch('adminEmails', form);

  return (
    <PageContainer header={{ title: false }}>
      <Title level={2}>邮件通知设置</Title>

      <Alert
        message="仅 sysadmin 角色用户可访问并修改这些设置。"
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Form<EmailSettingsForm>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          smtpPort: 587,
          smtpSecure: false,
          fromName: 'Doggy Nav',
          enableNotifications: true,
          adminEmails: [],
        }}
      >
        <Title level={3}>SMTP 配置</Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="smtpHost"
              label="SMTP 服务器"
              rules={[{ required: true, message: '请输入 SMTP 服务器地址' }]}
            >
              <Input placeholder="smtp.example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="smtpPort"
              label="SMTP 端口"
              rules={[{ required: true, message: '请输入 SMTP 端口' }]}
            >
              <Input type="number" placeholder="587" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="smtpSecure"
              label="启用 SSL/TLS"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="smtpUser"
              label="SMTP 用户名"
              rules={[{ required: true, message: '请输入 SMTP 用户名' }]}
            >
              <Input placeholder="your-email@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="smtpPass"
              label="SMTP 密码"
              rules={[{ required: true, message: '请输入 SMTP 密码' }]}
            >
              <Input.Password placeholder="请输入 SMTP 密码" />
            </Form.Item>
          </Col>
        </Row>

        <Title level={3}>发件人配置</Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fromName"
              label="发件人名称"
              rules={[{ required: true, message: '请输入发件人名称' }]}
            >
              <Input placeholder="Doggy Nav" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fromAddress"
              label="发件邮箱"
              rules={[
                {
                  required: true,
                  message: '请输入发件邮箱地址',
                },
              ]}
            >
              <Input placeholder="noreply@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="replyTo"
              label="回复邮箱"
              rules={[{ required: true, message: '请输入回复邮箱地址' }]}
            >
              <Input placeholder="support@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Title level={3}>通知配置</Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="enableNotifications"
              label="启用通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="adminEmails"
              label="管理员邮箱"
              help="接收提交通知的邮箱地址，每行一个"
            >
              <Input.TextArea
                rows={4}
                placeholder={`admin1@example.com\nadmin2@example.com`}
                onChange={(e) => {
                  const emails = e.target.value
                    .split('\n')
                    .filter((email) => email.trim());
                  form.setFieldValue('adminEmails', emails);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {adminEmails && adminEmails.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <Text strong>管理员收件人：</Text>
            <ul>
              {adminEmails.map((email, index) => (
                <li key={index}>{email}</li>
              ))}
            </ul>
          </div>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存设置
            </Button>
            <Button onClick={loadSettings} loading={loading}>
              重置
            </Button>
            <Button onClick={handleTestEmail} loading={testLoading}>
              发送测试邮件
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Alert
        message="注意事项"
        description={
          <div>
            <ul>
              <li>修改后会立即生效</li>
              <li>测试邮件会通过当前配置的 SMTP 服务器发送</li>
              <li>管理员邮箱用于接收新的提交通知</li>
              <li>请确保 SMTP 凭据正确，避免邮件发送失败</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
      />
    </PageContainer>
  );
}
