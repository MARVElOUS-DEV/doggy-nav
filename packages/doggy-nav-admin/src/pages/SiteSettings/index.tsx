import { getSiteSettings, updateSiteSettings } from '@/services/api';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text, Link } = Typography;

type SupportCurrency = 'usd' | 'hkd';

interface SupportTierForm {
  id?: string;
  label?: string;
  description?: string;
  amounts?: Partial<Record<SupportCurrency, number>>;
}

interface SiteSettingsForm {
  siteTitle?: string;
  logoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  copyrightText?: string;
  feedbackUrl?: string;
  creatorProfile?: {
    name?: string;
    title?: string;
    headline?: string;
    bio?: string;
    mission?: string;
  };
  supportSettings?: {
    enabled?: boolean;
    creatorLabel?: string;
    defaultCurrency?: SupportCurrency;
    currencies?: SupportCurrency[];
    tiers?: SupportTierForm[];
  };
}

const supportCurrencyOptions = [
  { label: 'USD', value: 'usd' as const },
  { label: 'HKD', value: 'hkd' as const },
];

const defaultSupportTiers: SupportTierForm[] = [
  {
    id: 'espresso',
    label: 'Espresso',
    description: 'A small thank-you for the idea and the craft.',
    amounts: { usd: 300, hkd: 2500 },
  },
  {
    id: 'latte',
    label: 'Latte',
    description: 'A steady boost for more late-night polishing.',
    amounts: { usd: 700, hkd: 5500 },
  },
  {
    id: 'beans',
    label: 'Coffee Beans',
    description: 'A bigger nudge for the next batch of features.',
    amounts: { usd: 1500, hkd: 12000 },
  },
];

function getDefaultSupportSettings(): NonNullable<
  SiteSettingsForm['supportSettings']
> {
  return {
    enabled: true,
    creatorLabel: 'Doggy Nav Creator',
    defaultCurrency: 'hkd',
    currencies: ['usd', 'hkd'],
    tiers: defaultSupportTiers,
  };
}

function normalizeSettingsResponse(response: any): SiteSettingsForm {
  const settings = response?.data ?? response ?? {};

  return {
    ...settings,
    seoKeywords: Array.isArray(settings.seoKeywords)
      ? settings.seoKeywords.join(', ')
      : '',
    creatorProfile: {
      name: settings.creatorProfile?.name || '',
      title: settings.creatorProfile?.title || '',
      headline: settings.creatorProfile?.headline || '',
      bio: settings.creatorProfile?.bio || '',
      mission: settings.creatorProfile?.mission || '',
    },
    supportSettings: {
      ...getDefaultSupportSettings(),
      ...settings.supportSettings,
      currencies:
        Array.isArray(settings.supportSettings?.currencies) &&
        settings.supportSettings.currencies.length > 0
          ? settings.supportSettings.currencies
          : getDefaultSupportSettings().currencies,
      tiers:
        Array.isArray(settings.supportSettings?.tiers) &&
        settings.supportSettings.tiers.length > 0
          ? settings.supportSettings.tiers
          : getDefaultSupportSettings().tiers,
    },
  };
}

function toSubmitPayload(values: SiteSettingsForm) {
  return {
    ...values,
    seoKeywords: values.seoKeywords
      ? values.seoKeywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    creatorProfile: values.creatorProfile,
    supportSettings: {
      ...values.supportSettings,
      currencies: values.supportSettings?.currencies || [],
      tiers: (values.supportSettings?.tiers || []).map((tier) => ({
        id: tier.id?.trim(),
        label: tier.label?.trim(),
        description: tier.description?.trim(),
        amounts: {
          usd: tier.amounts?.usd ?? undefined,
          hkd: tier.amounts?.hkd ?? undefined,
        },
      })),
    },
  };
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
      form.setFieldsValue(normalizeSettingsResponse(response || {}));
    } catch (error) {
      message.error('加载站点定制设置失败');
    }
  };

  const handleSubmit = async (values: SiteSettingsForm) => {
    setLoading(true);
    try {
      await updateSiteSettings(toSubmitPayload(values));
      message.success('站点定制设置保存成功');
      await loadSettings();
    } catch (error) {
      message.error('保存站点定制设置失败');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = Form.useWatch('logoUrl', form);
  const feedbackUrl = Form.useWatch('feedbackUrl', form);
  const supportEnabled = Form.useWatch(['supportSettings', 'enabled'], form);
  const enabledCurrencies =
    Form.useWatch(['supportSettings', 'currencies'], form) ||
    getDefaultSupportSettings().currencies;

  return (
    <PageContainer header={{ title: false }}>
      <Title level={2}>站点定制</Title>

      <Alert
        message="admin 及以上角色可修改这些站点级设置，变更会同步影响主站展示与支持付款配置。"
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form<SiteSettingsForm>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Card bordered={false}>
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

          <Divider />

          <Title level={3}>About Me</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['creatorProfile', 'name']} label="名称">
                <Input placeholder="Your Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['creatorProfile', 'title']} label="身份标题">
                <Input placeholder="Independent builder, bookmark curator..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['creatorProfile', 'headline']} label="头图文案">
            <Input.TextArea
              rows={3}
              placeholder="一句话介绍你的项目与建站初衷"
            />
          </Form.Item>

          <Form.Item name={['creatorProfile', 'bio']} label="详细介绍">
            <Input.TextArea
              rows={5}
              placeholder="介绍你是谁、为什么做 Doggy Nav、希望用户感受到什么"
            />
          </Form.Item>

          <Form.Item name={['creatorProfile', 'mission']} label="支持用途说明">
            <Input.TextArea
              rows={3}
              placeholder="例如：支持将用于托管成本、实验功能与后续打磨"
            />
          </Form.Item>

          <Divider />

          <Title level={3}>Coffee Payment</Title>

          <Form.Item
            name={['supportSettings', 'enabled']}
            label="启用支持付款"
            valuePropName="checked"
            extra="关闭后主站会隐藏咖啡支持卡片，同时后端拒绝 checkout 请求。"
          >
            <Switch />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['supportSettings', 'creatorLabel']}
                label="付款展示名称"
              >
                <Input placeholder="Doggy Nav Creator" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['supportSettings', 'defaultCurrency']}
                label="默认币种"
                rules={[
                  { required: !!supportEnabled, message: '请选择默认币种' },
                ]}
              >
                <Select
                  options={supportCurrencyOptions.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['supportSettings', 'currencies']}
            label="启用币种"
            rules={[
              {
                validator: async (_, value) => {
                  if (!supportEnabled) return;
                  if (Array.isArray(value) && value.length > 0) return;
                  throw new Error('至少启用一个币种');
                },
              },
            ]}
          >
            <Checkbox.Group options={supportCurrencyOptions} />
          </Form.Item>

          <Form.List name={['supportSettings', 'tiers']}>
            {(fields, { add, remove }) => (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Text strong>支持档位</Text>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        id: '',
                        label: '',
                        description: '',
                        amounts: { usd: undefined, hkd: undefined },
                      })
                    }
                  >
                    添加档位
                  </Button>
                </Space>

                {fields.map((field) => (
                  <Card
                    key={field.key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={`档位 ${field.name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      ) : null
                    }
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'id']}
                          label="档位 ID"
                          rules={[{ required: true, message: '请输入档位 ID' }]}
                        >
                          <Input placeholder="espresso" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'label']}
                          label="显示名称"
                          rules={[
                            { required: true, message: '请输入显示名称' },
                          ]}
                        >
                          <Input placeholder="Espresso" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[field.name, 'description']}
                          label="描述"
                          rules={[{ required: true, message: '请输入描述' }]}
                        >
                          <Input placeholder="A small thank-you..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, 'amounts', 'usd']}
                          label="USD 金额（分）"
                          rules={[
                            {
                              validator: async (_, value) => {
                                if (
                                  !supportEnabled ||
                                  !enabledCurrencies.includes('usd')
                                )
                                  return;
                                if (Number.isInteger(value) && value > 0)
                                  return;
                                throw new Error('请输入有效的 USD 金额');
                              },
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            precision={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={[field.name, 'amounts', 'hkd']}
                          label="HKD 金额（分）"
                          rules={[
                            {
                              validator: async (_, value) => {
                                if (
                                  !supportEnabled ||
                                  !enabledCurrencies.includes('hkd')
                                )
                                  return;
                                if (Number.isInteger(value) && value > 0)
                                  return;
                                throw new Error('请输入有效的 HKD 金额');
                              },
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            precision={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button
                onClick={() =>
                  form.setFieldsValue({
                    supportSettings: getDefaultSupportSettings(),
                  })
                }
              >
                填入默认支持配置
              </Button>
              <Button onClick={() => void loadSettings()}>重新加载</Button>
            </Space>
          </Form.Item>
        </Card>
      </Form>
    </PageContainer>
  );
}
