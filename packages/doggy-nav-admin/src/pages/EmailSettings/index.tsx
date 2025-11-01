import {
  getEmailSettings,
  testEmailSettings,
  updateEmailSettings,
} from '@/services/api';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
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
      message.error('Failed to load email settings');
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
      message.success('Email settings updated successfully');
    } catch (error) {
      message.error('Failed to update email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    try {
      await testEmailSettings({});
      message.success('Test email sent successfully');
    } catch (error) {
      message.error('Failed to send test email');
    } finally {
      setTestLoading(false);
    }
  };

  const adminEmails = Form.useWatch('adminEmails', form);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Card>
        <Title level={2}>Email Notification Settings</Title>

        <Alert
          message="Only users with sysadmin role can access and modify these settings."
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
          <Title level={3}>SMTP Configuration</Title>

          <Form.Item
            name="smtpHost"
            label="SMTP Host"
            rules={[{ required: true, message: 'Please enter SMTP host' }]}
          >
            <Input placeholder="smtp.example.com" />
          </Form.Item>

          <Form.Item
            name="smtpPort"
            label="SMTP Port"
            rules={[{ required: true, message: 'Please enter SMTP port' }]}
          >
            <Input type="number" placeholder="587" />
          </Form.Item>

          <Form.Item
            name="smtpSecure"
            label="Use SSL/TLS"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="smtpUser"
            label="SMTP Username"
            rules={[{ required: true, message: 'Please enter SMTP username' }]}
          >
            <Input placeholder="your-email@example.com" />
          </Form.Item>

          <Form.Item
            name="smtpPass"
            label="SMTP Password"
            rules={[{ required: true, message: 'Please enter SMTP password' }]}
          >
            <Input.Password placeholder="Enter SMTP password" />
          </Form.Item>

          <Title level={3}>Sender Configuration</Title>

          <Form.Item
            name="fromName"
            label="From Name"
            rules={[{ required: true, message: 'Please enter sender name' }]}
          >
            <Input placeholder="Doggy Nav" />
          </Form.Item>

          <Form.Item
            name="fromAddress"
            label="From Address"
            rules={[
              { required: true, message: 'Please enter sender email address' },
            ]}
          >
            <Input placeholder="noreply@example.com" />
          </Form.Item>

          <Form.Item
            name="replyTo"
            label="Reply To Address"
            rules={[
              { required: true, message: 'Please enter reply-to address' },
            ]}
          >
            <Input placeholder="support@example.com" />
          </Form.Item>

          <Title level={3}>Notification Settings</Title>

          <Form.Item
            name="enableNotifications"
            label="Enable Notifications"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="adminEmails"
            label="Admin Emails"
            help="Email addresses that will receive submission notifications (one per line)"
          >
            <Input.TextArea
              rows={4}
              placeholder="admin1@example.com
admin2@example.com"
              onChange={(e) => {
                const emails = e.target.value
                  .split('\n')
                  .filter((email) => email.trim());
                form.setFieldValue('adminEmails', emails);
              }}
            />
          </Form.Item>

          {adminEmails && adminEmails.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <Text strong>Admin recipients:</Text>
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
                Save Settings
              </Button>
              <Button onClick={loadSettings} loading={loading}>
                Reset
              </Button>
              <Button onClick={handleTestEmail} loading={testLoading}>
                Send Test Email
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Alert
          message="Important Notes"
          description={
            <div>
              <ul>
                <li>Changes take effect immediately</li>
                <li>Test email will be sent from the configured SMTP server</li>
                <li>
                  Admin emails are used for receiving new submission
                  notifications
                </li>
                <li>
                  Ensure SMTP credentials are correct to avoid delivery failures
                </li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />
      </Card>
    </div>
  );
}
