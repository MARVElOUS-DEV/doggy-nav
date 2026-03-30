import { API_NAV } from '@/services/api';
import request, { defaultHeaders } from '@/utils/request';
import {
  EyeOutlined,
  LinkOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { history } from '@umijs/max';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import type { editor } from 'monaco-editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Paragraph, Text, Title, Link } = Typography;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];
const MAX_FILES = 3;
const MAX_SIZE_MB = 3;

type NavRecord = {
  id: string;
  name?: string;
  href?: string;
  desc?: string;
  detail?: string;
  logo?: string;
  categoryName?: string;
  categoryId?: string;
  tags?: string[];
  authorName?: string;
  authorUrl?: string;
};

function getNavIdFromPathname(pathname: string) {
  const match = pathname.match(/^\/nav\/list\/([^/]+)\/detail$/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

function MarkdownPreview({ value }: { value?: string }) {
  if (!value?.trim()) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无 Markdown 内容"
      />
    );
  }

  return (
    <div style={{ lineHeight: 1.75 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: '0 0 12px' }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: '0 0 12px',
                paddingLeft: 12,
                borderLeft: '3px solid #d9d9d9',
                color: 'rgba(0, 0, 0, 0.65)',
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code
                style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(0, 0, 0, 0.06)',
                }}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  overflowX: 'auto',
                  margin: '0 0 12px',
                  padding: 12,
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <code>{children}</code>
              </pre>
            ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: '8px 12px',
                border: '1px solid #f0f0f0',
                textAlign: 'left',
                background: '#fafafa',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ padding: '8px 12px', border: '1px solid #f0f0f0' }}>
              {children}
            </td>
          ),
          img: ({ src, alt }) => (
            <img
              src={src || ''}
              alt={alt || ''}
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}

export default function NavDetailEditorPage() {
  const navId = useMemo(
    () => getNavIdFromPathname(history.location.pathname),
    [],
  );
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navRecord, setNavRecord] = useState<NavRecord | null>(null);
  const [detail, setDetail] = useState('');

  const insertAtCursor = useCallback((text: string) => {
    const activeEditor = editorRef.current;
    if (activeEditor) {
      const selection = activeEditor.getSelection();
      if (selection) {
        activeEditor.executeEdits('nav-detail-editor', [
          {
            range: selection,
            text,
            forceMoveMarkers: true,
          },
        ]);
        activeEditor.focus();
        return;
      }
    }

    setDetail((prev) => `${prev}${prev ? '\n' : ''}${text}`);
  }, []);

  const fetchNavRecord = useCallback(async () => {
    if (!navId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response: any = await request({
        url: API_NAV,
        method: 'GET',
        data: { id: navId },
      });
      const record = response?.data || null;
      setNavRecord(record);
      setDetail(typeof record?.detail === 'string' ? record.detail : '');
    } catch (error: any) {
      message.error(error?.message || '加载导航详情失败');
      setNavRecord(null);
    } finally {
      setLoading(false);
    }
  }, [navId]);

  useEffect(() => {
    fetchNavRecord();
  }, [fetchNavRecord]);

  const handleSave = useCallback(async () => {
    if (!navId) {
      message.error('缺少导航 ID');
      return;
    }

    setSaving(true);
    try {
      await request({
        url: API_NAV,
        method: 'PUT',
        msg: '详情保存成功',
        data: {
          id: navId,
          detail,
        },
      });
      setNavRecord((prev) => (prev ? { ...prev, detail } : prev));
    } catch (error: any) {
      message.error(error?.message || '详情保存失败');
    } finally {
      setSaving(false);
    }
  }, [detail, navId]);

  const validateFiles = useCallback((files: File[]) => {
    if (!files.length) {
      return '请选择图片文件';
    }
    if (files.length > MAX_FILES) {
      return `一次最多上传 ${MAX_FILES} 张图片`;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `不支持的图片格式: ${file.type || file.name}`;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return `文件 "${file.name}" 超过 ${MAX_SIZE_MB}MB 限制`;
      }
    }
    return null;
  }, []);

  const uploadImages = useCallback(
    async (files: File[]) => {
      const validationError = validateFiles(files);
      if (validationError) {
        message.error(validationError);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await fetch('/api/images/upload', {
          method: 'POST',
          credentials: 'include',
          headers: defaultHeaders(),
          body: formData,
        });
        const result = await response.json();

        if (!response.ok || result?.success === false) {
          throw new Error(result?.error || result?.msg || '图片上传失败');
        }

        const images = result?.data?.images || result?.images || [];
        if (!images.length) {
          throw new Error('上传成功，但未返回图片地址');
        }

        insertAtCursor(
          images.map((item: any) => `![image](${item.url})`).join('\n'),
        );
        message.success(`已插入 ${images.length} 张图片`);
      } catch (error: any) {
        message.error(error?.message || '图片上传失败');
      } finally {
        setUploading(false);
      }
    },
    [insertAtCursor, validateFiles],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      await uploadImages(files);
    },
    [uploadImages],
  );

  const editorOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      minimap: { enabled: false },
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'on',
      fontSize: 14,
      padding: { top: 12, bottom: 12 },
    }),
    [],
  );

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!navId) {
    return <Alert type="error" message="无效的导航详情编辑地址" showIcon />;
  }

  if (!navRecord) {
    return <Alert type="error" message="未找到对应的导航记录" showIcon />;
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Breadcrumb
        items={[
          {
            title: <a onClick={() => history.push('/nav/list')}>导航列表</a>,
          },
          {
            title: navRecord.name || '编辑导航详情',
          },
        ]}
      />

      <Card>
        <Space
          align="start"
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <div>
            <Space size={8} align="center">
              <Title level={4} style={{ margin: 0 }}>
                {navRecord.name || '未命名导航'}
              </Title>
              {navRecord.href ? (
                <Link href={navRecord.href} target="_blank">
                  <LinkOutlined />
                </Link>
              ) : null}
            </Space>
            <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
              在独立页面中维护该导航的 Markdown
              详情内容，支持图片上传与实时预览。
            </Paragraph>
          </div>

          <Space wrap>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              保存详情
            </Button>
          </Space>
        </Space>

        <Descriptions
          column={{ xs: 1, md: 2, xl: 3 }}
          size="small"
          style={{ marginTop: 24 }}
        >
          <Descriptions.Item label="网站名称">
            {navRecord.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {navRecord.categoryName || navRecord.categoryId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {navRecord.tags?.length ? navRecord.tags.join(', ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网站链接" span={2}>
            {navRecord.href ? (
              <Link href={navRecord.href} target="_blank">
                {navRecord.href}
              </Link>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="作者">
            {navRecord.authorUrl ? (
              <Link href={navRecord.authorUrl} target="_blank">
                {navRecord.authorName || navRecord.authorUrl}
              </Link>
            ) : (
              navRecord.authorName || '-'
            )}
          </Descriptions.Item>
        </Descriptions>

        {navRecord.desc ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="简介"
            description={navRecord.desc}
          />
        ) : null}
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card
            title="Markdown 编辑"
            extra={
              <Text type="secondary">
                支持 GFM 语法，图片会以 Markdown 链接插入光标位置
              </Text>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ borderTop: '1px solid #f0f0f0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: '#fafafa',
                }}
              >
                <Text type="secondary">
                  在这里编辑 Markdown，上传图片后会直接插入到当前光标位置。
                </Text>
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  上传图片
                </Button>
              </div>
              <Editor
                height="680px"
                defaultLanguage="markdown"
                value={detail}
                onChange={(value) => setDetail(value ?? '')}
                onMount={(instance) => {
                  editorRef.current = instance;
                }}
                options={editorOptions}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            title={
              <Space>
                <EyeOutlined />
                <span>实时预览</span>
              </Space>
            }
          >
            <div
              style={{
                minHeight: 680,
                overflow: 'auto',
                padding: 8,
              }}
            >
              <MarkdownPreview value={detail} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="编辑提示">
        <Space direction="vertical" size={6}>
          <Text>
            1. 使用“上传图片”后会自动把 Markdown 图片语法插入到当前光标位置。
          </Text>
          <Text>2. 如果只想补充简单文字，可直接在左侧编辑器修改并保存。</Text>
          <Text>3. 右侧预览与前台详情页一样支持表格、代码块、引用和图片。</Text>
          <Text>
            4. 当前页面只保存 `detail` 字段，基础信息仍在导航列表抽屉中编辑。
          </Text>
        </Space>
      </Card>
    </Space>
  );
}
