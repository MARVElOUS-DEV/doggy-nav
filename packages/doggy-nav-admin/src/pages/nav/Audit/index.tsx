import TableCom from '@/components/TableCom';
import { API_NAV_AUDIT, API_NAV_LIST } from '@/services/api';
import { NavStatus } from '@/types/api';
import { getCategoryDisplayName } from '@/utils/helpers';
import request from '@/utils/request';
import { formatDateTime } from '@/utils/time';
import { ActionType, ProColumns } from '@ant-design/pro-table';
import {
  Button,
  Descriptions,
  Drawer,
  Image,
  Popconfirm,
  Space,
  Tag,
  message,
} from 'antd';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function RandomColorTag({ children }) {
  const colors = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'purple',
  ];
  return (
    <Tag color={colors[Math.floor(Math.random() * colors.length)]}>
      {children}
    </Tag>
  );
}

type NavRecord = {
  id: string;
  status?: NavStatus;
  name?: string;
  tags?: Array<
    string | { id?: string; name?: string; displayName?: string; slug?: string }
  >;
  desc?: string;
  detail?: string;
  href?: string;
  logo?: string;
  categoryId?: string;
  categoryName?: string;
  category?: { id?: string; name?: string };
  authorName?: string;
  authorUrl?: string;
  audience?: {
    visibility?: 'public' | 'authenticated' | 'restricted' | 'hide' | string;
    allowRoles?: Array<
      | string
      | { id?: string; name?: string; displayName?: string; slug?: string }
    >;
    allowGroups?: Array<
      | string
      | { id?: string; name?: string; displayName?: string; slug?: string }
    >;
  };
  createTimeDate?: string | number;
};

function MarkdownPreview({ value }: { value?: string }) {
  if (!value?.trim()) return '-';

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

function getDetailContent(record: NavRecord | null) {
  if (!record) return undefined;
  return record.detail?.trim() ? record.detail : record.desc;
}

const navStatusMeta: Record<number, { text: string; color: string }> = {
  [NavStatus.pass]: { text: '已通过', color: 'success' },
  [NavStatus.wait]: { text: '审核中', color: 'processing' },
  [NavStatus.reject]: { text: '已拒绝', color: 'error' },
};

const visibilityTextMap: Record<string, string> = {
  public: '公开',
  authenticated: '登录可见',
  restricted: '受限（指定角色/用户组）',
  hide: '隐藏',
};

function getEntityLabel(item: any) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.displayName || item.name || item.slug || item.id || '';
}

function renderTagList(items?: any[]) {
  if (!items?.length) return '-';

  return (
    <Space wrap>
      {items.map((item, index) => {
        const label = getEntityLabel(item);
        return label ? (
          <RandomColorTag key={`${label}-${index}`}>{label}</RandomColorTag>
        ) : null;
      })}
    </Space>
  );
}

export default function NavAuditListPage() {
  const actionRef = React.useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);
  const [detailRecord, setDetailRecord] = React.useState<NavRecord | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const openDetailDrawer = React.useCallback((record: NavRecord) => {
    setDetailRecord(record);
    setDrawerOpen(true);
  }, []);

  const closeDetailDrawer = React.useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const columns: ProColumns[] = [
    {
      title: '审核状态',
      dataIndex: 'status',
      valueType: 'select',
      initialValue: ['1'],
      valueEnum: {
        1: { text: '审核中', status: 'Default' },
        2: { text: '已拒绝', status: 'Error' },
      },
      width: 100,
    },
    {
      title: '网站名称',
      dataIndex: 'name',
      search: false,
      width: 180,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      search: false,
      width: 90,
      render: (_, record: NavRecord) => (
        <Button type="link" onClick={() => openDetailDrawer(record)}>
          查看
        </Button>
      ),
    },
    {
      title: '网站标签',
      dataIndex: 'tags',
      search: false,
      width: 250,
      renderText: (text, record) => (
        <Space>
          {record.tags.map((item) => (
            <RandomColorTag key={item}>{item}</RandomColorTag>
          ))}
        </Space>
      ),
    },

    {
      title: '网站描述',
      dataIndex: 'desc',
      search: false,
      width: 300,
    },
    {
      title: '网站链接',
      dataIndex: 'href',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createTimeDate',
      search: false,
      renderText: (v) => formatDateTime(v),
    },
  ];

  async function onActionClick(
    id: string,
    action: any,
    status = NavStatus.pass,
  ) {
    await request({
      url: API_NAV_AUDIT,
      method: 'PUT',
      data: {
        id,
        status,
      },
      msg: status === NavStatus.pass ? '通过成功' : '拒绝成功',
    });
    action?.reload();
  }

  async function onBatchAudit(status: NavStatus) {
    if (!selectedRows.length) return;
    const ids = selectedRows.map((r) => r.id);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          request({
            url: API_NAV_AUDIT,
            method: 'PUT',
            data: { id, status },
          }),
        ),
      );
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.length - fulfilled;
      if (fulfilled > 0) {
        message.success(
          `${status === NavStatus.pass ? '通过' : '拒绝'}成功 ${fulfilled} 条`,
        );
      }
      if (rejected > 0) {
        message.warning(`有 ${rejected} 条操作失败`);
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      if (fulfilled > 0) actionRef.current?.reload();
    } catch (e) {
      message.error('批量操作失败，请稍后重试');
    }
  }

  const detailStatus =
    typeof detailRecord?.status === 'number'
      ? navStatusMeta[detailRecord.status]
      : undefined;
  const detailVisibility = detailRecord?.audience?.visibility
    ? visibilityTextMap[detailRecord.audience.visibility] ||
      detailRecord.audience.visibility
    : '-';
  const detailCategorySource =
    detailRecord?.category?.name ||
    detailRecord?.categoryName ||
    detailRecord?.categoryId;
  const detailCategory = detailCategorySource
    ? getCategoryDisplayName(detailCategorySource)
    : '-';
  const detailContent = getDetailContent(detailRecord);

  return (
    <>
      <TableCom
        columns={columns}
        requestParams={{ url: API_NAV_LIST, method: 'GET' }}
        actionRef={actionRef}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows as any[]);
          },
        }}
        toolbar={{
          actions: [
            <Popconfirm
              key="batch-pass"
              title="确定批量通过选中项吗？"
              onConfirm={() => onBatchAudit(NavStatus.pass)}
              disabled={!selectedRows.length}
            >
              <Button type="primary" disabled={!selectedRows.length}>
                批量通过
              </Button>
            </Popconfirm>,
            <Popconfirm
              key="batch-reject"
              title="确定批量拒绝选中项吗？"
              onConfirm={() => onBatchAudit(NavStatus.reject)}
              disabled={!selectedRows.length}
            >
              <Button danger disabled={!selectedRows.length}>
                批量拒绝
              </Button>
            </Popconfirm>,
          ],
        }}
        renderOptions={(text, record, _, action) =>
          record.status !== NavStatus.reject
            ? [
                <Popconfirm
                  title={'确定通过吗？'}
                  onConfirm={() => onActionClick(record.id, action, 0)}
                  key="确定通过吗？"
                >
                  <a>通过</a>
                </Popconfirm>,
                <Popconfirm
                  title={'确定拒绝吗？'}
                  onConfirm={() => onActionClick(record.id, action, 2)}
                  key="确定拒绝吗？"
                >
                  <a>拒绝</a>
                </Popconfirm>,
              ]
            : []
        }
      />
      <Drawer
        title="导航详情"
        open={drawerOpen}
        width={640}
        onClose={closeDetailDrawer}
        destroyOnHidden
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="审核状态">
            {detailStatus ? (
              <Tag color={detailStatus.color}>{detailStatus.text}</Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="网站名称">
            {detailRecord?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网站 LOGO">
            {detailRecord?.logo ? (
              <Image
                width={80}
                src={detailRecord.logo}
                alt={detailRecord.name || '网站 LOGO'}
              />
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="网站链接">
            {detailRecord?.href ? (
              <a href={detailRecord.href} target="_blank" rel="noreferrer">
                {detailRecord.href}
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="详细介绍">
            <MarkdownPreview value={detailContent} />
          </Descriptions.Item>
          <Descriptions.Item label="简短描述">
            {detailRecord?.desc || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网站标签">
            {renderTagList(detailRecord?.tags)}
          </Descriptions.Item>
          <Descriptions.Item label="网站分类">
            {detailCategory}
          </Descriptions.Item>
          <Descriptions.Item label="作者名称">
            {detailRecord?.authorName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="作者网站">
            {detailRecord?.authorUrl ? (
              <a href={detailRecord.authorUrl} target="_blank" rel="noreferrer">
                {detailRecord.authorUrl}
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="可见性">
            {detailVisibility}
          </Descriptions.Item>
          <Descriptions.Item label="允许角色">
            {renderTagList(detailRecord?.audience?.allowRoles)}
          </Descriptions.Item>
          <Descriptions.Item label="允许用户组">
            {renderTagList(detailRecord?.audience?.allowGroups)}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {detailRecord?.createTimeDate
              ? formatDateTime(detailRecord.createTimeDate)
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  );
}
