'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Form, Input, Select, Button, Message } from '@arco-design/web-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '@/utils/axios';
import api, { API_NAV_ADD, API_NAV_REPTILE } from '@/utils/api';
import { useAtomValue } from 'jotai';
import { RecommendFormValues } from '@/types';
import { categoriesAtom, tagsAtom, isAuthenticatedAtom } from '@/store/store';
import { useTranslation } from 'react-i18next';
import { OVERVIEW } from '@/utils/localCategories';
import MarkdownEditor from '@/components/MarkdownEditor';
import MarkdownContent from '@/components/MarkdownContent';
import { Eye, Search, Sparkles } from 'lucide-react';
import { LoadingIndicator, LoadingSpinner } from '@/components/PageLoading';

const FormItem = Form.Item;
const URL_PATTERN =
  /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?/;

type GeneratedField = 'name' | 'desc' | 'detail' | 'logo' | 'tags';
type GeneratedValues = Partial<Pick<RecommendFormValues, GeneratedField>>;

const generatedFields: GeneratedField[] = ['name', 'desc', 'detail', 'logo', 'tags'];

const isEmptyValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || String(value).trim() === '';
};

const isSameValue = (left: unknown, right: unknown) => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
  }
  return String(left ?? '') === String(right ?? '');
};

const assignGeneratedValue = (
  target: GeneratedValues,
  field: GeneratedField,
  value: GeneratedValues[GeneratedField]
) => {
  if (field === 'tags') {
    if (Array.isArray(value)) target.tags = value;
    return;
  }

  if (typeof value !== 'string') return;
  if (field === 'name') target.name = value;
  if (field === 'desc') target.desc = value;
  if (field === 'detail') target.detail = value;
  if (field === 'logo') target.logo = value;
};

function WebsiteUrlField({
  value,
  onChange,
  id,
  error,
  placeholder,
  busy,
  className,
  children,
}: {
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  error?: boolean;
  placeholder: string;
  busy: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <Input
        id={id}
        value={value}
        onChange={onChange}
        error={error}
        placeholder={placeholder}
        aria-busy={busy}
        className={`${className} min-w-0 flex-1`}
      />
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">{children}</div>
    </div>
  );
}

export default function Recommend() {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState<'scrape' | 'ai' | null>(null);
  const categories = useAtomValue(categoriesAtom);
  const tags = useAtomValue(tagsAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [groups, setGroups] = useState<Array<{ id: string; slug: string; displayName?: string }>>(
    []
  );
  const [form] = Form.useForm();
  const { t } = useTranslation('translation');
  const detailPreview = Form.useWatch('detail', form) ?? '';
  const hrefValue = Form.useWatch('href', form) ?? '';
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const generatedValuesRef = useRef<GeneratedValues>({});
  const formLoading = metadataLoading !== null;

  const imageHostname = (() => {
    try {
      return hrefValue ? new URL(hrefValue).hostname : '';
    } catch {
      return '';
    }
  })();

  const addNav = async (values: RecommendFormValues) => {
    setLoading(true);
    try {
      // 如果选择了用户组，自动将visibility设置为restricted
      if (values.audience?.allowGroups && values.audience.allowGroups.length > 0) {
        values.audience.visibility = 'restricted';
      }

      await axios.post(API_NAV_ADD, values);
      Message.success(t('thank_you_support'));
      form.resetFields();
      generatedValuesRef.current = {};
      setIsPreviewMode(false);
    } catch (error) {
      Message.error(`${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getValidatedUrl = () => {
    const url = String(form.getFieldValue('href') ?? '').trim();
    if (!url) {
      Message.error(t('enter_url'));
      return null;
    }
    if (!URL_PATTERN.test(url)) {
      Message.error(t('enter_correct_url'));
      return null;
    }
    form.setFieldsValue({ href: url });
    return url;
  };

  const applyGeneratedValues = (values: GeneratedValues) => {
    const previousValues = generatedValuesRef.current;
    const nextValues: GeneratedValues = {};
    const appliedValues: GeneratedValues = {};

    generatedFields.forEach((field) => {
      const value = values[field];
      if (isEmptyValue(value)) return;

      const currentValue = form.getFieldValue(field);
      const previousValue = previousValues[field];
      if (isEmptyValue(currentValue) || isSameValue(currentValue, previousValue)) {
        assignGeneratedValue(nextValues, field, value);
        assignGeneratedValue(appliedValues, field, value);
      }
    });

    if (Object.keys(nextValues).length > 0) {
      form.setFieldsValue(nextValues);
      generatedValuesRef.current = {
        ...previousValues,
        ...appliedValues,
      };
    }

    return Object.keys(nextValues).length;
  };

  const scrapeNavInfo = async (url: string): Promise<GeneratedValues> => {
    const { logo, name, desc } = (await axios.get<{ logo?: string; name: string; desc: string }>(
      `${API_NAV_REPTILE}?url=${encodeURIComponent(url)}`
    )) as any;
    return {
      logo: logo ?? `https://www.google.com/s2/favicons?domain=${url}`,
      name,
      desc,
      detail: desc,
    };
  };

  const getNavInfo = async () => {
    const url = getValidatedUrl();
    if (!url) return;
    setMetadataLoading('scrape');
    try {
      const scrapedValues = await scrapeNavInfo(url);
      applyGeneratedValues(scrapedValues);
      Message.success(t('scrape_autofill_success'));
    } catch (e) {
      Message.error(t('scrape_autofill_failed'));
    } finally {
      setMetadataLoading(null);
    }
  };

  const getAiNavInfo = async () => {
    const url = getValidatedUrl();
    if (!url) return;
    setMetadataLoading('ai');
    try {
      const aiValues = await api.aiRecommendationAutofill({
        url,
      });
      if (!aiValues || Object.keys(aiValues).length === 0) {
        Message.error(t('ai_autofill_failed'));
        return;
      }

      const appliedCount = applyGeneratedValues(aiValues);
      if (appliedCount === 0) {
        Message.success(t('autofill_preserved_user_edits'));
      } else {
        Message.success(t('ai_autofill_success'));
      }
    } catch (e) {
      Message.error(t('ai_autofill_failed'));
    } finally {
      setMetadataLoading(null);
    }
  };

  // Load user's groups when authenticated
  useEffect(() => {
    let mounted = true;
    const loadGroups = async () => {
      if (!isAuthenticated) return;
      try {
        const res = (await axios.get('/api/groups')) as any;
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res)
              ? res
              : [];
        if (!mounted) return;
        setGroups(list);
        // Set default selection if not set yet
        const current = form.getFieldValue('audience.allowGroups');
        if (
          (!current || (Array.isArray(current) && current.length === 0)) &&
          Array.isArray(list) &&
          list.length > 0
        ) {
          form.setFieldsValue({ audience: { allowGroups: [list[0].id] } });
        }
      } catch {}
    };
    loadGroups();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const rules = {
    href: [
      { required: true, message: t('enter_url') },
      {
        pattern: URL_PATTERN,
        message: t('enter_correct_url'),
      },
    ],
    tags: [{ max: 5, message: t('max_5_tags') }],
    categoryId: [{ required: true, message: t('select_category') }],
    name: [{ required: true, message: t('enter_name') }],
    desc: [{ required: true, message: t('enter_description') }],
    logo: [{ required: true, message: t('enter_logo') }],
    authorUrl: [
      {
        pattern: URL_PATTERN,
        message: t('enter_correct_url'),
      },
    ],
    authorName: [
      {
        pattern: /^[\u4e00-\u9fa5]{2,6}$/,
        message: t('author_name_2_6_chars'),
      },
    ],
  };

  const fieldChromeClass =
    'rounded-xl border border-theme-border bg-theme-background text-theme-foreground transition-colors focus-within:border-theme-primary focus-within:ring-2 focus-within:ring-theme-primary/15';
  const inputClass = `h-11 sm:h-12 ${fieldChromeClass}`;
  const multiSelectClass = `min-h-11 sm:min-h-12 ${fieldChromeClass}`;

  return (
    <div className="py-2 text-theme-foreground sm:px-4 sm:py-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-5xl"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-6 px-1 text-left sm:mb-8 sm:text-center"
        >
          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary sm:h-12 sm:w-12 sm:rounded-2xl">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <h1 className="my-0 text-3xl font-bold tracking-tight text-theme-foreground sm:text-4xl">
            {t('recommend_website')}
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-theme-muted-foreground sm:mx-auto sm:text-lg">
            {t('share_quality_websites')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl border border-theme-border bg-[var(--color-card)] p-4 shadow-sm sm:rounded-3xl sm:p-7 lg:p-10"
        >
          <Form form={form} layout="vertical" onSubmit={addNav}>
            <AnimatePresence>
              {formLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-theme-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 ring-1 ring-theme-border"
                >
                  <LoadingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-x-5 gap-y-1 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-2"
              >
                <FormItem label={t('website_link')} field="href" rules={rules.href}>
                  <WebsiteUrlField
                    placeholder={t('enter_website_url')}
                    busy={formLoading}
                    className={inputClass}
                  >
                    <button
                      type="button"
                      disabled={metadataLoading === 'ai'}
                      onClick={getNavInfo}
                      className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-background px-3 text-sm font-medium text-theme-muted-foreground transition-colors hover:border-theme-primary/40 hover:text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12"
                    >
                      {metadataLoading === 'scrape' ? (
                        <LoadingSpinner className="h-4 w-4" />
                      ) : (
                        <Search size={16} aria-hidden="true" />
                      )}
                      <span className="truncate">{t('traditional_scrape')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={metadataLoading === 'scrape'}
                      onClick={getAiNavInfo}
                      className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-theme-primary/20 bg-theme-primary/10 px-3 text-sm font-semibold text-theme-primary transition-colors hover:bg-theme-primary/15 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12"
                    >
                      {metadataLoading === 'ai' ? (
                        <LoadingSpinner className="h-4 w-4" />
                      ) : (
                        <Sparkles size={16} aria-hidden="true" />
                      )}
                      <span className="truncate">{t('ai_autofill')}</span>
                    </button>
                  </WebsiteUrlField>
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FormItem label={t('website_name')} field="name" rules={rules.name}>
                  <Input placeholder={t('enter_website_name')} className={inputClass} />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <FormItem label={t('website_logo')} field="logo" rules={rules.logo}>
                  <Input placeholder={t('enter_website_logo')} className={inputClass} />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="md:col-span-2"
              >
                <FormItem label={t('website_description')} field="desc" rules={rules.desc}>
                  <Input placeholder={t('enter_website_description')} className={inputClass} />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <FormItem label={t('website_category')} field="categoryId" rules={rules.categoryId}>
                  <Select
                    placeholder={t('select')}
                    showSearch
                    className={`recommend-sel-container category-select ${inputClass}`}
                  >
                    {renderCategories(categories, t)}
                  </Select>
                </FormItem>
              </motion.div>

              {groups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                >
                  <FormItem
                    label={t('website_group', { defaultValue: '👥 Group' })}
                    field={'audience.allowGroups'}
                  >
                    <Select
                      mode="multiple"
                      placeholder={t('select')}
                      className={`recommend-sel-container recommend-multi-select category-select ${multiSelectClass}`}
                    >
                      {groups.map((g) => (
                        <Select.Option key={g.id} value={g.id}>
                          {g.displayName || g.slug}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <FormItem label={t('website_tags')} field="tags" rules={rules.tags}>
                  <Select
                    mode="multiple"
                    showSearch
                    allowCreate
                    placeholder={t('enter_website_tags')}
                    className={`recommend-sel-container recommend-multi-select ${multiSelectClass}`}
                  >
                    {tags.map((item) => (
                      <Select.Option key={item.name} value={item.name}>
                        {item.label}
                      </Select.Option>
                    ))}
                  </Select>
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <FormItem label={t('recommender_name')} field="authorName" rules={rules.authorName}>
                  <Input placeholder={t('enter_recommender_name')} className={inputClass} />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <FormItem
                  label={t('recommender_website')}
                  field="authorUrl"
                  rules={rules.authorUrl}
                >
                  <Input placeholder={t('enter_recommender_url')} className={inputClass} />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="md:col-span-2"
              >
                <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium text-theme-foreground">
                    {t('website_details')}
                  </label>
                  <div className="flex w-full rounded-xl bg-theme-muted p-1 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(false)}
                      className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition-all sm:flex-none ${
                        !isPreviewMode
                          ? 'bg-[var(--color-card)] text-theme-primary shadow-sm'
                          : 'text-theme-muted-foreground hover:text-theme-foreground'
                      }`}
                    >
                      {t('back_to_edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(true)}
                      className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition-all sm:flex-none ${
                        isPreviewMode
                          ? 'bg-[var(--color-card)] text-theme-primary shadow-sm'
                          : 'text-theme-muted-foreground hover:text-theme-foreground'
                      }`}
                    >
                      <Eye size={14} />
                      {t('markdown_preview')}
                    </button>
                  </div>
                </div>

                <FormItem
                  field="detail"
                  noStyle
                  getValueFromEvent={(value: string | undefined) => value ?? ''}
                >
                  {isPreviewMode ? (
                    <div className="min-h-64 rounded-xl border border-dashed border-theme-border bg-theme-background/50 p-4 sm:min-h-[400px] sm:rounded-2xl sm:p-6">
                      <MarkdownContent
                        value={detailPreview}
                        className="prose prose-sm dark:prose-invert max-w-none"
                        fallback={
                          <div className="flex h-full flex-col items-center justify-center text-theme-muted-foreground">
                            <p>{t('markdown_preview_empty')}</p>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <MarkdownEditor
                      placeholder={t('enter_website_details')}
                      height="clamp(260px, 50vh, 400px)"
                      className="w-full !rounded-xl !border-theme-border !bg-theme-background sm:!rounded-2xl"
                      enableImageUpload={!!imageHostname && isAuthenticated}
                      imageHostname={imageHostname}
                    />
                  )}
                </FormItem>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="mt-4 text-center sm:mt-6"
            >
              <FormItem>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="h-12 w-full rounded-xl border-0 bg-theme-primary px-8 text-base font-semibold text-theme-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto sm:min-w-64"
                  >
                    {loading ? t('submitting') : t('submit_recommendation')}
                  </Button>
                </motion.div>
              </FormItem>
            </motion.div>
          </Form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mx-auto mt-5 max-w-2xl px-4 text-center text-sm leading-relaxed text-theme-muted-foreground sm:mt-6"
        >
          <p>{t('thank_you_contribution')}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

const renderCategories = (categories, t) => {
  const filtered = (categories || []).filter((c) => c?.id !== OVERVIEW.id);
  const defaultLists: React.ReactNode[] = [];
  const list = filtered
    .map((group) => {
      if (!group.children || group.children.length === 0) {
        defaultLists.push(
          <Select.Option key={group.id} value={group.id} disabled={group.onlyFolder === true}>
            {t(group.name, { defaultValue: group.name })}
          </Select.Option>
        );
        return null;
      } else {
        return (
          <Select.OptGroup key={group.id} label={t(group.name, { defaultValue: group.name })}>
            {/* Parent selectable only if it has own navs; otherwise disabled */}
            <Select.Option
              key={`${group.id}__parent`}
              value={group.id}
              disabled={group.onlyFolder === true}
            >
              {t(group.name, { defaultValue: group.name })}
            </Select.Option>
            {group.children?.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {t(item.name, { defaultValue: item.name })}
              </Select.Option>
            ))}
          </Select.OptGroup>
        );
      }
    })
    .filter(Boolean);
  return [
    <Select.OptGroup key="default-list-key" label={t('categories', { defaultValue: 'Categories' })}>
      {defaultLists}
    </Select.OptGroup>,
    ...list,
  ];
};
