import { getSiteSettings, updateSiteSettings } from '@/services/api';
import { PageContainer } from '@ant-design/pro-layout';
import { Alert, Button, Form, Input, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text, Link } = Typography;

interface SiteSettingsForm {
  siteTitle?: string;
  logoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  copyrightText?: string;
  feedbackUrl?: string;
}

export default function SiteSettingsPage() {
  const [form] = Form.useForm<SiteSettingsForm>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getSiteSettings();
      if (!response) return;

      form.setFieldsValue({
        ...response,
        seoKeywords: Array.isArray(response.seoKeywords)
          ? response.seoKeywords.join(', ')
          : '',
      });
    } catch (error) {
      message.error('加载站点定制设置失败');
    }
  };

  const handleSubmit = async (values: SiteSettingsForm) => {
    setLoading(true);
    try {
      await updateSiteSettings({
        ...values,
        seoKeywords: values.seoKeywords
          ? values.seoKeywords
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      });
      message.success('站点定制设置保存成功');
    } catch (error) {
      message.error('保存站点定制设置失败');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = Form.useWatch('logoUrl', form);
  const feedbackUrl = Form.useWatch('feedbackUrl', form);

  return (
    <PageContainer header={{ title: false }}>
      <Title level={2}>站点定制</Title>

      <Alert
        message="admin 及以上角色可修改这些站点级设置，变更会同步影响主站展示。"
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form<SiteSettingsForm>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Title level={3}>品牌信息</Title>

        <Form.Item
          name="siteTitle"
          label="站点标题"
          extra="用于主站头部品牌标题，以及 SEO 标题的回退值。"
        >
          <Input placeholder="Doggy Nav" />
        </Form.Item>

        <Form.Item
          name="logoUrl"
          label="Logo 地址"
          extra="支持完整 URL 或以 / 开头的站内静态资源路径。"
          rules={[
            {
              validator: async (_, value) => {
                if (!value) return;
                const text = String(value).trim();
                if (text.startsWith('/') || /^https?:\/\//.test(text)) return;
                throw new Error('请输入有效的 Logo 地址');
              },
            },
          ]}
        >
          <Input placeholder="https://example.com/logo.png 或 /logo-nav-black.png" />
        </Form.Item>

        {logoUrl ? (
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Logo 预览
            </Text>
            <img
              src={logoUrl}
              alt="Site logo preview"
              style={{ maxHeight: 56, maxWidth: 220, objectFit: 'contain' }}
            />
          </div>
        ) : null}

        <Title level={3}>SEO 信息</Title>

        <Form.Item
          name="seoTitle"
          label="SEO 标题"
          extra="页面未提供自定义标题时，主站会使用这里的值。"
        >
          <Input placeholder="Doggy Nav | Team Navigation Hub" />
        </Form.Item>

        <Form.Item name="seoDescription" label="SEO 描述">
          <Input.TextArea rows={4} placeholder="输入默认 meta description" />
        </Form.Item>

        <Form.Item
          name="seoKeywords"
          label="SEO 关键词"
          extra="使用英文逗号分隔多个关键词。"
        >
          <Input.TextArea
            rows={3}
            placeholder="navigation, bookmarks, team portal"
          />
        </Form.Item>

        <Title level={3}>站点信息</Title>

        <Form.Item name="copyrightText" label="版权文案">
          <Input placeholder="© 2026 My Team. All rights reserved." />
        </Form.Item>

        <Form.Item
          name="feedbackUrl"
          label="反馈地址"
          extra="主站右侧反馈按钮会打开这个链接。"
          rules={[
            {
              validator: async (_, value) => {
                if (!value) return;
                const text = String(value).trim();
                if (text.startsWith('/') || /^https?:\/\//.test(text)) return;
                throw new Error('请输入有效的反馈地址');
              },
            },
          ]}
        >
          <Input placeholder="https://github.com/your-org/your-repo/issues" />
        </Form.Item>

        {feedbackUrl ? (
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ marginRight: 8 }}>
              反馈预览:
            </Text>
            <Link href={feedbackUrl} target="_blank">
              {feedbackUrl}
            </Link>
          </div>
        ) : null}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
            <Button onClick={() => void loadSettings()}>重新加载</Button>
          </Space>
        </Form.Item>
      </Form>
    </PageContainer>
  );
}
