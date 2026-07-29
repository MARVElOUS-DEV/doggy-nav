import { getSiteSettings, updateSiteSettings } from '@/services/api';
import { getPublicEnv } from '@/utils/publicEnv';
import request, { defaultHeaders } from '@/utils/request';
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { FormProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text, Link } = Typography;

type SupportCurrency = 'usd' | 'hkd';

interface SupportTierForm {
  id?: string;
  label?: string;
  description?: string;
  amounts?: Partial<Record<SupportCurrency, number>>;
}

interface HeroSlideForm {
  title?: string;
  description?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  active?: boolean;
  order?: number;
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
  heroSlides?: HeroSlideForm[];
}

const supportCurrencyOptions = [
  { label: 'USD', value: 'usd' as const },
  { label: 'HKD', value: 'hkd' as const },
];

const settingsSectionByField: Record<string, string> = {
  siteTitle: 'brand',
  logoUrl: 'brand',
  seoTitle: 'seo',
  seoDescription: 'seo',
  seoKeywords: 'seo',
  copyrightText: 'site',
  feedbackUrl: 'site',
  heroSlides: 'slides',
  creatorProfile: 'creator',
  supportSettings: 'support',
};

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
    heroSlides: Array.isArray(settings.heroSlides) ? settings.heroSlides : [],
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
    heroSlides: (values.heroSlides || []).map((slide, index) => ({
      title: slide.title?.trim() || '',
      description: slide.description?.trim() || '',
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl?.trim() || undefined,
      ctaLabel: slide.ctaLabel?.trim() || undefined,
      ctaHref: slide.ctaHref?.trim() || undefined,
      active: !!slide.active,
      order: Number.isInteger(slide.order) ? slide.order : index,
    })),
  };
}

export default function SiteSettingsPage() {
  const [form] = Form.useForm<SiteSettingsForm>();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('brand');
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const imageServiceUrl = useMemo(
    () => getPublicEnv('UMI_APP_IMAGE_SERVICE_URL'),
    [],
  );

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
    if (uploadingSlide !== null) {
      message.warning('请等待媒体上传完成后再保存');
      return;
    }

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

  const handleSubmitFailed: NonNullable<
    FormProps<SiteSettingsForm>['onFinishFailed']
  > = ({ errorFields }) => {
    const firstError = errorFields[0]?.name;
    const section = firstError
      ? settingsSectionByField[String(firstError[0])]
      : undefined;
    if (!section || !firstError) return;

    setActiveSection(section);
    requestAnimationFrame(() =>
      form.scrollToField(firstError, { block: 'center' }),
    );
  };

  const uploadHeroMedia = async (file: File, index: number) => {
    const maxMb = file.type.startsWith('video/') ? 10 : 3;
    if (
      ![
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/avif',
        'video/mp4',
        'video/webm',
      ].includes(file.type)
    ) {
      message.error('仅支持常用图片、MP4 或 WebM 文件');
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      message.error(
        `${file.type.startsWith('video/') ? '视频' : '图片'}不能超过 ${maxMb} MB`,
      );
      return;
    }

    setUploadingSlide(index);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const headers = defaultHeaders();
      if (imageServiceUrl) {
        const tokenResponse: any = await request({
          url: '/api/auth/token',
          method: 'GET',
        });
        const token = tokenResponse?.data?.token;
        if (!token) throw new Error('获取图片服务认证信息失败');
        headers.Authorization = token.startsWith('Bearer ')
          ? token
          : `Bearer ${token}`;
      }

      const response = await fetch(
        imageServiceUrl
          ? `${imageServiceUrl.replace(/\/+$/, '')}/upload`
          : '/api/images/upload',
        {
          method: 'POST',
          credentials: imageServiceUrl ? 'omit' : 'include',
          headers,
          body: formData,
        },
      );
      const result = await response.json();
      const media = result?.data?.images?.[0];
      if (!response.ok || !media?.url) {
        throw new Error(result?.error || result?.msg || '媒体上传失败');
      }

      form.setFieldValue(['heroSlides', index, 'mediaUrl'], media.url);
      form.setFieldValue(
        ['heroSlides', index, 'mediaType'],
        (media.type || file.type).startsWith('video/') ? 'video' : 'image',
      );
      message.success('媒体上传成功');
    } catch (error: any) {
      message.error(error?.message || '媒体上传失败');
    } finally {
      setUploadingSlide(null);
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
        onFinishFailed={handleSubmitFailed}
      >
        <Card bordered={false}>
          <Collapse
            accordion
            activeKey={activeSection}
            onChange={(key) => setActiveSection(String(key))}
            style={{ marginBottom: 24 }}
            items={[
              {
                key: 'brand',
                label: '品牌信息',
                forceRender: true,
                children: (
                  <>
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
                            if (
                              text.startsWith('/') ||
                              /^https?:\/\//.test(text)
                            )
                              return;
                            throw new Error('请输入有效的 Logo 地址');
                          },
                        },
                      ]}
                    >
                      <Input placeholder="https://example.com/logo.png 或 /logo-nav-black.png" />
                    </Form.Item>

                    {logoUrl ? (
                      <div style={{ marginBottom: 20 }}>
                        <Text
                          strong
                          style={{ display: 'block', marginBottom: 8 }}
                        >
                          Logo 预览
                        </Text>
                        <img
                          src={logoUrl}
                          alt="Site logo preview"
                          style={{
                            maxHeight: 56,
                            maxWidth: 220,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                ),
              },
              {
                key: 'seo',
                label: 'SEO 信息',
                forceRender: true,
                children: (
                  <>
                    <Form.Item
                      name="seoTitle"
                      label="SEO 标题"
                      extra="页面未提供自定义标题时，主站会使用这里的值。"
                    >
                      <Input placeholder="Doggy Nav | Team Navigation Hub" />
                    </Form.Item>

                    <Form.Item name="seoDescription" label="SEO 描述">
                      <Input.TextArea
                        rows={4}
                        placeholder="输入默认 meta description"
                      />
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
                  </>
                ),
              },
              {
                key: 'site',
                label: '站点信息',
                forceRender: true,
                children: (
                  <>
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
                            if (
                              text.startsWith('/') ||
                              /^https?:\/\//.test(text)
                            )
                              return;
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
                  </>
                ),
              },
              {
                key: 'slides',
                label: '首页轮播',
                forceRender: true,
                children: (
                  <>
                    <Text type="secondary">
                      默认登录与搜索头图始终排在第一张；这里的启用项按顺序值展示。
                    </Text>

                    <Form.List name="heroSlides">
                      {(fields, { add, remove }) => (
                        <div style={{ marginTop: 16 }}>
                          <Button
                            icon={<PlusOutlined />}
                            disabled={uploadingSlide !== null}
                            onClick={() =>
                              add({
                                title: '',
                                description: '',
                                active: true,
                                order: fields.length,
                              })
                            }
                            style={{ marginBottom: 16 }}
                          >
                            添加轮播项
                          </Button>

                          {fields.map((field) => (
                            <Card
                              key={field.key}
                              size="small"
                              title={`轮播项 ${field.name + 1}`}
                              style={{ marginBottom: 16 }}
                              extra={
                                <Button
                                  type="text"
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  disabled={uploadingSlide !== null}
                                  onClick={() => remove(field.name)}
                                  aria-label={`删除轮播项 ${field.name + 1}`}
                                />
                              }
                            >
                              <Row gutter={16}>
                                <Col span={18}>
                                  <Form.Item
                                    name={[field.name, 'title']}
                                    label="标题"
                                  >
                                    <Input />
                                  </Form.Item>
                                </Col>
                                <Col span={3}>
                                  <Form.Item
                                    name={[field.name, 'order']}
                                    label="顺序"
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入整数顺序',
                                      },
                                    ]}
                                  >
                                    <InputNumber
                                      precision={0}
                                      style={{ width: '100%' }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={3}>
                                  <Form.Item
                                    name={[field.name, 'active']}
                                    label="启用"
                                    valuePropName="checked"
                                  >
                                    <Switch />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Form.Item
                                name={[field.name, 'description']}
                                label="描述"
                              >
                                <Input.TextArea rows={3} />
                              </Form.Item>

                              <Form.Item noStyle shouldUpdate>
                                {() => {
                                  const slide = form.getFieldValue([
                                    'heroSlides',
                                    field.name,
                                  ]) as HeroSlideForm | undefined;
                                  return slide?.mediaUrl ? (
                                    <div style={{ marginBottom: 16 }}>
                                      {slide.mediaType === 'video' ? (
                                        <video
                                          src={slide.mediaUrl}
                                          controls
                                          muted
                                          style={{
                                            width: '100%',
                                            maxHeight: 260,
                                            objectFit: 'cover',
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={slide.mediaUrl}
                                          alt="轮播媒体预览"
                                          style={{
                                            width: '100%',
                                            maxHeight: 260,
                                            objectFit: 'cover',
                                          }}
                                        />
                                      )}
                                    </div>
                                  ) : null;
                                }}
                              </Form.Item>

                              <Space style={{ marginBottom: 16 }}>
                                <Upload
                                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/webm"
                                  maxCount={1}
                                  showUploadList={false}
                                  beforeUpload={(file) => {
                                    void uploadHeroMedia(file, field.name);
                                    return false;
                                  }}
                                >
                                  <Button
                                    icon={<UploadOutlined />}
                                    disabled={
                                      uploadingSlide !== null &&
                                      uploadingSlide !== field.name
                                    }
                                    loading={uploadingSlide === field.name}
                                  >
                                    {form.getFieldValue([
                                      'heroSlides',
                                      field.name,
                                      'mediaUrl',
                                    ])
                                      ? '替换媒体'
                                      : '上传媒体'}
                                  </Button>
                                </Upload>
                                {form.getFieldValue([
                                  'heroSlides',
                                  field.name,
                                  'mediaUrl',
                                ]) ? (
                                  <Button
                                    icon={<DeleteOutlined />}
                                    disabled={uploadingSlide !== null}
                                    onClick={() => {
                                      form.setFieldValue(
                                        ['heroSlides', field.name, 'mediaUrl'],
                                        undefined,
                                      );
                                      form.setFieldValue(
                                        ['heroSlides', field.name, 'mediaType'],
                                        undefined,
                                      );
                                    }}
                                  >
                                    移除媒体
                                  </Button>
                                ) : null}
                              </Space>

                              <Form.Item
                                name={[field.name, 'mediaUrl']}
                                label="媒体地址"
                                extra="可上传或填写 /、http://、https:// 开头的地址。留空时使用渐变背景。"
                                dependencies={[
                                  ['heroSlides', field.name, 'mediaType'],
                                ]}
                                rules={[
                                  {
                                    validator: async (_, value) => {
                                      const mediaType = form.getFieldValue([
                                        'heroSlides',
                                        field.name,
                                        'mediaType',
                                      ]);
                                      if (
                                        Boolean(value) !== Boolean(mediaType)
                                      ) {
                                        throw new Error(
                                          '媒体地址与媒体类型必须同时填写',
                                        );
                                      }
                                      if (!value) return;
                                      if (
                                        /^(\/|https?:\/\/)/.test(
                                          String(value).trim(),
                                        )
                                      )
                                        return;
                                      throw new Error('请输入有效的媒体地址');
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'mediaType']}
                                label="媒体类型"
                                dependencies={[
                                  ['heroSlides', field.name, 'mediaUrl'],
                                ]}
                                rules={[
                                  {
                                    validator: async (_, value) => {
                                      const mediaUrl = form.getFieldValue([
                                        'heroSlides',
                                        field.name,
                                        'mediaUrl',
                                      ]);
                                      if (
                                        Boolean(value) !== Boolean(mediaUrl)
                                      ) {
                                        throw new Error(
                                          '媒体类型与媒体地址必须同时填写',
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Select
                                  allowClear
                                  options={[
                                    { label: '图片', value: 'image' },
                                    { label: '视频', value: 'video' },
                                  ]}
                                />
                              </Form.Item>

                              <Row gutter={16}>
                                <Col span={12}>
                                  <Form.Item
                                    name={[field.name, 'ctaLabel']}
                                    label="按钮文案"
                                    dependencies={[
                                      ['heroSlides', field.name, 'ctaHref'],
                                    ]}
                                    rules={[
                                      {
                                        validator: async (_, value) => {
                                          const href = form.getFieldValue([
                                            'heroSlides',
                                            field.name,
                                            'ctaHref',
                                          ]);
                                          if (
                                            Boolean(value) !== Boolean(href)
                                          ) {
                                            throw new Error(
                                              '按钮文案与地址必须同时填写',
                                            );
                                          }
                                        },
                                      },
                                    ]}
                                  >
                                    <Input />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item
                                    name={[field.name, 'ctaHref']}
                                    label="按钮地址"
                                    dependencies={[
                                      ['heroSlides', field.name, 'ctaLabel'],
                                    ]}
                                    rules={[
                                      {
                                        validator: async (_, value) => {
                                          const label = form.getFieldValue([
                                            'heroSlides',
                                            field.name,
                                            'ctaLabel',
                                          ]);
                                          if (
                                            Boolean(value) !== Boolean(label)
                                          ) {
                                            throw new Error(
                                              '按钮地址与文案必须同时填写',
                                            );
                                          }
                                          if (!value) return;
                                          if (
                                            /^(\/|https?:\/\/)/.test(
                                              String(value).trim(),
                                            )
                                          )
                                            return;
                                          throw new Error(
                                            '请输入有效的按钮地址',
                                          );
                                        },
                                      },
                                    ]}
                                  >
                                    <Input />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Form.List>
                  </>
                ),
              },
              {
                key: 'creator',
                label: 'About Me',
                forceRender: true,
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name={['creatorProfile', 'name']}
                          label="名称"
                        >
                          <Input placeholder="Your Name" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={['creatorProfile', 'title']}
                          label="身份标题"
                        >
                          <Input placeholder="Independent builder, bookmark curator..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name={['creatorProfile', 'headline']}
                      label="头图文案"
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="一句话介绍你的项目与建站初衷"
                      />
                    </Form.Item>

                    <Form.Item
                      name={['creatorProfile', 'bio']}
                      label="详细介绍"
                    >
                      <Input.TextArea
                        rows={5}
                        placeholder="介绍你是谁、为什么做 Doggy Nav、希望用户感受到什么"
                      />
                    </Form.Item>

                    <Form.Item
                      name={['creatorProfile', 'mission']}
                      label="支持用途说明"
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="例如：支持将用于托管成本、实验功能与后续打磨"
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'support',
                label: 'Coffee Payment',
                forceRender: true,
                children: (
                  <>
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
                            {
                              required: !!supportEnabled,
                              message: '请选择默认币种',
                            },
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
                            if (Array.isArray(value) && value.length > 0)
                              return;
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
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入档位 ID',
                                      },
                                    ]}
                                  >
                                    <Input placeholder="espresso" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item
                                    name={[field.name, 'label']}
                                    label="显示名称"
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入显示名称',
                                      },
                                    ]}
                                  >
                                    <Input placeholder="Espresso" />
                                  </Form.Item>
                                </Col>
                                <Col span={8}>
                                  <Form.Item
                                    name={[field.name, 'description']}
                                    label="描述"
                                    rules={[
                                      { required: true, message: '请输入描述' },
                                    ]}
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
                                          if (
                                            Number.isInteger(value) &&
                                            value > 0
                                          )
                                            return;
                                          throw new Error(
                                            '请输入有效的 USD 金额',
                                          );
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
                                          if (
                                            Number.isInteger(value) &&
                                            value > 0
                                          )
                                            return;
                                          throw new Error(
                                            '请输入有效的 HKD 金额',
                                          );
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
                  </>
                ),
              },
            ]}
          />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={uploadingSlide !== null}
              >
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
