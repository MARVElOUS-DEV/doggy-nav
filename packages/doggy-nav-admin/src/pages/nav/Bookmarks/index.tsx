import TableCom from '@/components/TableCom';
import { GLOBAL_CATEGORY_ID } from '@/constants';
import CategorySelect from '@/pages/nav/Category/CategorySelect';
import { API_CATEGORY, API_NAV } from '@/services/api';
import request from '@/utils/request';
import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns } from '@ant-design/pro-table';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Upload,
} from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';

type RowItem = {
  id?: string;
  name: string;
  href: string;
  desc?: string;
  tags?: string[];
  logo?: string;
  categoryId?: string; // backend category id after creation/mapping
  categoryGuid?: string; // source folder guid
  __status?: 'pending' | 'success' | 'failed' | 'skipped';
  __error?: string;
};

type Mapping = {
  name?: string;
  href?: string;
  desc?: string;
  tags?: string;
  logo?: string;
  categoryId?: string; // unused for derived mapping
  typeKey?: string; // e.g. 'type'
  guidKey?: string; // e.g. 'guid' or 'id'
  childrenKey?: string; // e.g. 'children'
  typeFolderValue?: string; // e.g. 'folder'
  typeUrlValue?: string; // e.g. 'url'
  dateAddedKey?: string; // e.g. 'date_added'
};

type CatItem = {
  guid: string;
  name: string;
  parentGuid?: string | null;
  createdId?: string; // backend category id after creation
};

function parseJSONSafe(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// reserved helper if needed in the future
// function flattenNodes(input: any, childrenKey = 'children'): any[] {
//   if (Array.isArray(input)) return input.flatMap(n => flattenNodes(n, childrenKey));
//   if (input && typeof input === 'object') {
//     const children = Array.isArray((input as any)[childrenKey]) ? (input as any)[childrenKey] : [];
//     const cur = { ...input };
//     delete (cur as any)[childrenKey];
//     return [cur, ...children.flatMap((n: any) => flattenNodes(n, childrenKey))];
//   }
//   return [];
// }

function autoDetectMapping(keys: string[]): Mapping {
  const k = (s: string) =>
    keys.find((x) => x.toLowerCase() === s) ||
    keys.find((x) => x.toLowerCase().includes(s));
  return {
    name: k('name') || k('title') || k('text'),
    href: k('href') || k('url') || k('link'),
    desc: k('desc') || k('description') || k('summary'),
    tags: k('tags') || k('tag'),
    logo: k('logo') || k('icon') || k('favicon'),
    categoryId: undefined,
    typeKey: k('type') || 'type',
    guidKey: k('guid') || k('id') || 'guid',
    childrenKey: k('children') || 'children',
    typeFolderValue: 'folder',
    typeUrlValue: 'url',
    dateAddedKey: k('date_added') || k('created') || undefined,
  };
}

function normalizeItem(
  src: any,
  map: Mapping,
  defaults: Partial<RowItem>,
  parentGuid?: string | null,
): RowItem {
  const pick = (key?: string) => (key ? src?.[key] : undefined);
  let tags = pick(map.tags) ?? src?.tags;
  if (typeof tags === 'string')
    tags = tags
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  if (!Array.isArray(tags)) tags = [];
  const item: RowItem & { createTime?: number } = {
    name: String(pick(map.name) ?? src?.title ?? ''),
    href: String(pick(map.href) ?? src?.url ?? ''),
    desc: pick(map.desc) ?? src?.description ?? '',
    tags,
    logo: pick(map.logo) ?? src?.icon ?? '',
    categoryId: undefined,
    categoryGuid: parentGuid || undefined,
    __status: 'pending',
  } as RowItem;
  const dateAdded = pick(map.dateAddedKey as any) ?? src?.date_added;
  if (typeof dateAdded === 'number') {
    (item as any).createTime = dateAdded;
  }
  return item;
}

function isValidURL(u: string): boolean {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

async function saveBatch(rows: RowItem[], concurrency = 5): Promise<RowItem[]> {
  const queue = rows.filter((r) => r.__status !== 'success');
  const active: Promise<void>[] = [];
  async function run(row: RowItem) {
    try {
      await request({
        url: API_NAV,
        method: 'POST',
        data: {
          name: row.name,
          href: row.href,
          desc: row.desc,
          tags: row.tags,
          logo: row.logo,
          categoryId: row.categoryId,
        },
      });
      row.__status = 'success';
      row.__error = undefined;
    } catch (e: any) {
      row.__status = 'failed';
      row.__error = e?.message || String(e);
    }
  }
  async function next(): Promise<void> {
    const row = queue.shift();
    if (!row) return;
    const p = run(row).finally(() => {
      const i = active.indexOf(p as any);
      if (i >= 0) active.splice(i, 1);
    });
    active.push(p as any);
    if (active.length >= concurrency) await Promise.race(active);
    return next();
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length || 1) }).map(() =>
      next(),
    ),
  );
  return rows;
}

export default function BookmarksImportPage() {
  const [editorValue, setEditorValue] = useState<string>('[]');
  const [rows, setRows] = useState<RowItem[]>([]);
  const [cats, setCats] = useState<CatItem[]>([]);

  const [subSelections, setSubSelections] = useState<
    Record<string, React.Key[]>
  >({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [topParentCategoryId, setTopParentCategoryId] = useState<
    string | undefined
  >();
  const [fetchLogoOnSave, setFetchLogoOnSave] = useState<boolean>(false);
  const monacoRef = useRef<Monaco | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowItem | null>(null);

  const sample = useMemo(() => {
    const json = parseJSONSafe(editorValue);
    if (!json || typeof json !== 'object') return {};
    // Handle Chrome bookmarks structure: roots.{bookmark_bar, other, synced}.children
    const roots = (json as any).roots;
    if (roots && typeof roots === 'object') {
      const bb = roots.bookmark_bar?.children || [];
      const other = roots.other?.children || [];
      const synced = roots.synced?.children || [];
      const first = [...bb, ...other, ...synced][0];
      return first || {};
    }
    // Fallback to array/object
    if (Array.isArray(json)) return json[0] || {};
    return json || {};
  }, [editorValue]);

  const keys = useMemo(() => Object.keys(sample || {}), [sample]);
  const [mapping, setMapping] = useState<Mapping>(() =>
    autoDetectMapping(keys),
  );

  const handleEditorMount = useCallback((_: any, monaco: Monaco) => {
    monacoRef.current = monaco;
  }, []);

  const handleFile = async (file: File) => {
    const text = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ''));
      r.onerror = rej;
      r.readAsText(file);
    });
    setEditorValue(text);
    message.success('文件已加载到编辑器');
    return false;
  };

  const applyMapping = useCallback(() => {
    const json = parseJSONSafe(editorValue);
    if (!json) {
      message.error('JSON 解析失败');
      return;
    }
    // Determine entry nodes list (Chrome roots or direct array/tree)
    let entries: any[] = [];
    if (json && typeof json === 'object' && (json as any).roots) {
      const roots = (json as any).roots;
      entries = [
        ...(roots.bookmark_bar?.children || []),
        ...(roots.other?.children || []),
        ...(roots.synced?.children || []),
      ];
    } else if (Array.isArray(json)) {
      entries = json;
    } else {
      entries = [json];
    }
    // Walk tree to extract folders->categories and url->navs
    const typeKey = mapping.typeKey || 'type';
    const guidKey = mapping.guidKey || 'guid';
    const childrenKey = mapping.childrenKey || 'children';
    const typeFolderValue = mapping.typeFolderValue || 'folder';
    const typeUrlValue = mapping.typeUrlValue || 'url';
    const catList: CatItem[] = [];
    const navList: RowItem[] = [];
    const walk = (node: any, parentGuid: string | null) => {
      if (!node || typeof node !== 'object') return;
      const nodeType = node[typeKey];
      const children = Array.isArray(node[childrenKey])
        ? node[childrenKey]
        : [];
      const guid = String(node[guidKey] ?? node.id ?? '') || undefined;
      if (nodeType === typeFolderValue && guid) {
        const name = String(node[mapping.name || 'name'] ?? node.name ?? '');
        catList.push({ guid, name, parentGuid });
        children.forEach((c: any) => walk(c, guid));
        return;
      }
      // url item
      if (nodeType === typeUrlValue || node[mapping.href || 'url']) {
        navList.push(normalizeItem(node, mapping, {}, parentGuid));
      }
    };
    entries.forEach((n: any) => walk(n, null));
    // Dedup navs by href
    const seen = new Set<string>();
    const deDuped = navList.filter((r) => {
      if (!r.href) return false;
      const key = r.href.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setCats(catList);
    setRows(deDuped);
    message.success(
      `解析成功：分类 ${catList.length} 个，网址 ${deDuped.length} 条`,
    );
  }, [editorValue, mapping]);

  const formatEditor = () => {
    try {
      const obj = JSON.parse(editorValue);
      setEditorValue(JSON.stringify(obj, null, 2));
    } catch {
      message.warning('不是合法的 JSON，无法格式化');
    }
  };

  const validateRows = (list: RowItem[]) => {
    let invalid = 0;
    const updated = list.map((r) => {
      if (!r.name || !r.href || !isValidURL(r.href)) {
        r.__status = 'skipped';
        invalid++;
      }
      return r;
    });
    if (invalid)
      message.warning(
        `有 ${invalid} 条记录缺少必填或 URL 不合法，已标记为跳过`,
      );
    setRows(updated);
  };

  function getFaviconSrv(host: string) {
    // Lightweight service to avoid CORS; server uses a similar helper
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  }

  const onSaveNavs = async (onlyFailed = false, filterGuid?: string) => {
    const targets = rows.filter(
      (r) =>
        (!filterGuid || r.categoryGuid === filterGuid) &&
        r.__status !== 'skipped' &&
        (!onlyFailed ? r.__status !== 'success' : r.__status === 'failed'),
    );
    if (!targets.length) {
      message.info('没有需要保存的记录');
      return;
    }
    setSaving(true);
    setProgress(0);
    let done = 0;
    const wrapped = targets.map((r) => ({
      ...r,
      __onDone: () => {
        done++;
        setProgress(Math.round((done / targets.length) * 100));
      },
    }));
    // optionally enrich logo lazily at save-time
    const enriched = (wrapped as any as RowItem[]).map((r) => {
      if (!r.logo && fetchLogoOnSave && r.href) {
        try {
          const { hostname } = new URL(r.href);
          r.logo = getFaviconSrv(hostname);
        } catch {}
      }
      return r;
    });
    await saveBatch(enriched);
    wrapped.forEach((w) => (w as any).__onDone());
    setRows([...rows]);
    setSaving(false);
    const succ = wrapped.filter((r) => r.__status === 'success').length;
    const fail = wrapped.filter((r) => r.__status === 'failed').length;
    message.success(`完成：成功 ${succ} 条，失败 ${fail} 条`);
  };

  const saveCategories = async () => {
    if (!cats.length) {
      message.info('无分类可保存');
      return;
    }
    const byGuid = new Map<string, CatItem>();
    cats.forEach((c) => byGuid.set(c.guid, c));
    // Create categories level by level
    const created = new Map<string, string>(); // guid -> id
    const pending = new Set<string>(cats.map((c) => c.guid));
    const tryCreate = async (guid: string) => {
      const c = byGuid.get(guid)!;
      const parentId = c.parentGuid
        ? created.get(c.parentGuid)
        : topParentCategoryId || GLOBAL_CATEGORY_ID;
      if (c.parentGuid && !parentId) return false; // parent not created yet
      const res = await request({
        url: API_CATEGORY,
        method: 'POST',
        data: {
          name: c.name,
          categoryId: parentId,
          audience: { visibility: 'hide' },
        },
      });
      const id = res?.data?.id || res?.id || res?.id;
      if (id) {
        created.set(guid, id);
        c.createdId = id;
        pending.delete(guid);
        return true;
      }
      return false;
    };
    let progressGuard = 0;
    while (pending.size && progressGuard < 10000) {
      progressGuard++;
      let progressed = false;
      for (const guid of Array.from(pending)) {
        const ok = await tryCreate(guid);
        if (ok) progressed = true;
      }
      if (!progressed) break;
    }
    setCats([...cats]);
    if (pending.size) {
      message.error(
        `部分分类未创建成功：剩余 ${pending.size} 个（可能缺少父级）`,
      );
    } else {
      message.success(`分类创建完成：${created.size} 个`);
    }
    // map category ids onto rows by categoryGuid
    if (created.size) {
      const nextRows = rows.map((r) => ({
        ...r,
        categoryId: r.categoryGuid ? created.get(r.categoryGuid) : r.categoryId,
      }));
      setRows(nextRows);
    }
  };

  const columns = useMemo<ProColumns<RowItem>[]>(
    () => [
      { title: '名称', dataIndex: 'name', width: 220, ellipsis: true },
      { title: '链接', dataIndex: 'href', width: 320, ellipsis: true },
      {
        title: '状态',
        dataIndex: '__status',
        width: 100,
        valueType: 'select',
        valueEnum: {
          pending: { text: '待处理' },
          success: { text: '成功' },
          failed: { text: '失败' },
          skipped: { text: '跳过' },
        },
      },
      {
        title: '操作',
        valueType: 'option',
        width: 100,
        render: (_, record) => [
          <a
            key="edit"
            onClick={() => {
              setEditingRow(record);
              setDrawerOpen(true);
            }}
          >
            编辑
          </a>,
        ],
      },
    ],
    [],
  );

  const catColumns = useMemo<ProColumns<CatItem>[]>(
    () => [
      { title: '名称', dataIndex: 'name', width: 220 },
      { title: 'GUID', dataIndex: 'guid', width: 220 },
      { title: '父级GUID', dataIndex: 'parentGuid', width: 220 },
      { title: '创建后 id', dataIndex: 'createdId', width: 260 },
    ],
    [],
  );

  return (
    <PageContainer>
      <Tabs
        defaultActiveKey="preview"
        items={[
          {
            key: 'preview',
            label: '预览',
            children: (
              <Card
                title={
                  <Space>
                    <span>分类与下属网址预览</span>
                    <span>顶级父级（可选）：</span>
                    <CategorySelect
                      value={topParentCategoryId}
                      onChange={setTopParentCategoryId}
                    />
                    <Button type="primary" onClick={saveCategories}>
                      保存分类
                    </Button>
                    <span>保存时抓取图标</span>
                    <Switch
                      checked={fetchLogoOnSave}
                      onChange={setFetchLogoOnSave}
                    />
                  </Space>
                }
              >
                {saving && <Progress percent={progress} />}
                <TableCom
                  rowKey={(r) => r.guid}
                  columns={catColumns}
                  dataSource={cats}
                  search={false}
                  pagination={{ pageSize: 10 }}
                  expandable={{
                    expandedRowRender: (record) => {
                      const subNavs = rows.filter(
                        (r) => r.categoryGuid === record.guid,
                      );
                      return (
                        <TableCom
                          size="small"
                          rowKey={(r) => r.href + (r.name || '')}
                          columns={columns}
                          dataSource={subNavs}
                          search={false}
                          pagination={{ pageSize: 8 }}
                          rowSelection={{
                            selectedRowKeys: subSelections[record.guid] || [],
                            onChange: (keys) =>
                              setSubSelections((prev) => ({
                                ...prev,
                                [record.guid]: keys,
                              })),
                          }}
                          editable={{ type: 'multiple' }}
                          scroll={{ x: 'max-content' }}
                          toolBarRender={() => [
                            <Space key="sub-bulk">
                              <span>批量设置分类(id)：</span>
                              <CategorySelect
                                onChange={(v: string) => {
                                  const ids = new Set(
                                    (subSelections[record.guid] ||
                                      []) as string[],
                                  );
                                  const next = rows.map((r) =>
                                    ids.has(r.href + (r.name || ''))
                                      ? { ...r, categoryId: v }
                                      : r,
                                  );
                                  setRows(next);
                                }}
                              />
                              <Button onClick={() => validateRows(subNavs)}>
                                校验
                              </Button>
                              <Button
                                type="primary"
                                onClick={() => onSaveNavs(false, record.guid)}
                              >
                                保存此分类下网址
                              </Button>
                              <Button
                                onClick={() => onSaveNavs(true, record.guid)}
                              >
                                重试失败
                              </Button>
                            </Space>,
                          ]}
                        />
                      );
                    },
                  }}
                  scroll={{ x: 'max-content' }}
                  rowSelection={false}
                />
                <Drawer
                  title="编辑网址"
                  open={drawerOpen}
                  width={520}
                  onClose={() => setDrawerOpen(false)}
                  destroyOnHidden
                  footer={null}
                >
                  <Form
                    layout="vertical"
                    initialValues={{
                      name: editingRow?.name,
                      href: editingRow?.href,
                      desc: editingRow?.desc,
                      tags: (editingRow?.tags || []).join(','),
                      logo: editingRow?.logo,
                      categoryId: editingRow?.categoryId,
                    }}
                    onFinish={(vals) => {
                      if (!editingRow) return;
                      const key = editingRow.href + (editingRow.name || '');
                      const next = rows.map((r) =>
                        r.href + (r.name || '') === key
                          ? {
                              ...r,
                              desc: vals.desc,
                              tags: String(vals.tags || '')
                                .split(',')
                                .map((s: string) => s.trim())
                                .filter(Boolean),
                              logo: vals.logo,
                              categoryId: vals.categoryId,
                            }
                          : r,
                      );
                      setRows(next);
                      setDrawerOpen(false);
                      message.success('已更新');
                    }}
                  >
                    <Form.Item label="名称" name="name">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item label="链接" name="href">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item label="描述" name="desc">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item label="标签(逗号分隔)" name="tags">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Logo" name="logo">
                      <Input />
                    </Form.Item>
                    <Form.Item label="分类(id)" name="categoryId">
                      <CategorySelect />
                    </Form.Item>
                    <Space>
                      <Button onClick={() => setDrawerOpen(false)}>取消</Button>
                      <Button type="primary" htmlType="submit">
                        保存
                      </Button>
                    </Space>
                  </Form>
                </Drawer>
              </Card>
            ),
          },
          {
            key: 'editor',
            label: '编辑器',
            children: (
              <>
                <Card
                  title="书签 JSON 编辑器"
                  extra={
                    <Space>
                      <Upload
                        beforeUpload={handleFile}
                        showUploadList={false}
                        accept=".json"
                      >
                        <Button icon={<UploadOutlined />}>
                          加载 JSON 文件
                        </Button>
                      </Upload>
                      <Button onClick={formatEditor}>格式化</Button>
                    </Space>
                  }
                >
                  <Editor
                    height="520px"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={editorValue}
                    onChange={(v) => setEditorValue(v ?? '')}
                    onMount={handleEditorMount}
                    options={{ minimap: { enabled: false }, wordWrap: 'on' }}
                  />
                  <Divider />
                  <Form layout="inline">
                    <Form.Item>
                      <Button type="primary" onClick={applyMapping}>
                        应用并预览
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
                <Card style={{ marginTop: 16 }} title="字段映射">
                  <Row gutter={12}>
                    {(
                      [
                        'name',
                        'href',
                        'desc',
                        'tags',
                        'logo',
                        'categoryId',
                      ] as (keyof Mapping)[]
                    ).map((f) => (
                      <Col span={12} key={f} style={{ marginBottom: 8 }}>
                        <Space>
                          <span style={{ width: 90, display: 'inline-block' }}>
                            {f}
                          </span>
                          <Select
                            style={{ width: 220 }}
                            value={(mapping as any)[f]}
                            onChange={(v) =>
                              setMapping((m) => ({ ...m, [f]: v }))
                            }
                            allowClear
                            placeholder="选择源字段"
                            options={keys.map((k) => ({ label: k, value: k }))}
                          />
                        </Space>
                      </Col>
                    ))}
                    {(
                      ['typeKey', 'guidKey', 'childrenKey'] as (keyof Mapping)[]
                    ).map((f) => (
                      <Col span={12} key={f} style={{ marginBottom: 8 }}>
                        <Space>
                          <span style={{ width: 90, display: 'inline-block' }}>
                            {f}
                          </span>
                          <Select
                            style={{ width: 220 }}
                            value={(mapping as any)[f]}
                            onChange={(v) =>
                              setMapping((m) => ({ ...m, [f]: v }))
                            }
                            allowClear
                            placeholder="选择源字段"
                            options={keys.map((k) => ({ label: k, value: k }))}
                          />
                        </Space>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </>
            ),
          },
        ]}
      />
    </PageContainer>
  );
}
