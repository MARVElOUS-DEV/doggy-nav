import { GLOBAL_CATEGORY_ID } from '@/constants';
import { API_CATEGORY, API_NAV } from '@/services/api';
import request from '@/utils/request';
import {
  FolderOpenOutlined,
  LinkOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tree,
  Typography,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import {
  buildBookmarkImportIndex,
  parseBookmarkHtml,
  type BookmarkImportBookmark,
  type BookmarkImportFolder,
  type BookmarkImportNode,
} from './bookmarkImport';

type SaveSummary = {
  rootCategoryId: string;
  rootCategoryName: string;
  successCount: number;
  failureCount: number;
};

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function resolveResponseId(response: any) {
  return (
    response?.data?.id || response?.id || response?.data?._id || response?._id
  );
}

function createFallbackFavicon(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return '';
  }
}

export default function BookmarksImportPage() {
  const [importNodes, setImportNodes] = useState<BookmarkImportNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [rootCategoryName, setRootCategoryName] = useState('我的书签导入');
  const [fillMissingLogo, setFillMissingLogo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);

  const importIndex = useMemo(
    () => buildBookmarkImportIndex(importNodes),
    [importNodes],
  );

  const checkedKeySet = useMemo(() => new Set(checkedKeys), [checkedKeys]);

  const selectedBookmarks = useMemo(
    () =>
      importIndex.bookmarks.filter((bookmark) =>
        checkedKeySet.has(bookmark.key),
      ),
    [checkedKeySet, importIndex.bookmarks],
  );

  const requiredFolders = useMemo(() => {
    const folderKeySet = new Set<string>();
    selectedBookmarks.forEach((bookmark) => {
      bookmark.ancestorFolderKeys.forEach((folderKey) =>
        folderKeySet.add(folderKey),
      );
    });

    return Array.from(folderKeySet)
      .map((folderKey) => importIndex.nodeMap.get(folderKey))
      .filter(
        (node): node is BookmarkImportFolder =>
          !!node && node.type === 'folder',
      )
      .sort((left, right) => left.depth - right.depth);
  }, [importIndex.nodeMap, selectedBookmarks]);

  const activeNode = useMemo(
    () => (selectedKey ? importIndex.nodeMap.get(selectedKey) : undefined),
    [importIndex.nodeMap, selectedKey],
  );

  const treeData = useMemo(() => {
    const build = (nodes: BookmarkImportNode[]): any[] =>
      nodes.map((node) => ({
        key: node.key,
        title: (
          <Space size={8}>
            {node.type === 'folder' ? (
              <FolderOpenOutlined style={{ color: '#1677ff' }} />
            ) : (
              <LinkOutlined style={{ color: '#52c41a' }} />
            )}
            <span>{node.title}</span>
            {node.type === 'bookmark' ? (
              <Typography.Text
                type="secondary"
                style={{ maxWidth: 320 }}
                ellipsis={{ tooltip: node.url }}
              >
                {node.url}
              </Typography.Text>
            ) : (
              <Tag color="blue">{node.children.length} items</Tag>
            )}
          </Space>
        ),
        children: node.type === 'folder' ? build(node.children) : undefined,
      }));

    return build(importNodes);
  }, [importNodes]);

  const selectedTableColumns = useMemo<ColumnsType<BookmarkImportBookmark>>(
    () => [
      {
        title: '书签名称',
        dataIndex: 'title',
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.title}</Typography.Text>
            <Typography.Text type="secondary">
              {record.ancestorFolderKeys.length
                ? record.ancestorFolderKeys
                    .map((key) => importIndex.nodeMap.get(key)?.title)
                    .filter(Boolean)
                    .join(' / ')
                : rootCategoryName.trim() || '我的书签导入'}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '链接',
        dataIndex: 'url',
        ellipsis: true,
        render: (value: string) => (
          <Typography.Text ellipsis={{ tooltip: value }}>
            {value}
          </Typography.Text>
        ),
      },
      {
        title: '图标',
        dataIndex: 'icon',
        width: 120,
        render: (value: string | undefined, record) =>
          value ? (
            <img
              alt={record.title}
              src={value}
              style={{ width: 20, height: 20, objectFit: 'contain' }}
            />
          ) : (
            <Typography.Text type="secondary">Auto</Typography.Text>
          ),
      },
    ],
    [importIndex.nodeMap, rootCategoryName],
  );

  const handleFileUpload = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const parsedNodes = parseBookmarkHtml(text);
      const parsedIndex = buildBookmarkImportIndex(parsedNodes);
      const suggestedName = file.name.replace(/\.[^.]+$/, '').trim();

      setImportNodes(parsedNodes);
      setCheckedKeys(parsedIndex.allKeys);
      setExpandedKeys(parsedIndex.defaultExpandedKeys);
      setSelectedKey(parsedIndex.allKeys[0]);
      setRootCategoryName(suggestedName || '我的书签导入');
      setSaveErrors([]);
      setSaveSummary(null);

      message.success(
        `已解析 ${parsedIndex.bookmarks.length} 条书签，${parsedIndex.folders.length} 个文件夹`,
      );
    } catch (error: any) {
      message.error(error?.message || '导入失败，请确认文件格式正确');
    }

    return false;
  };

  const handleSave = async () => {
    const finalRootName = rootCategoryName.trim();
    if (!finalRootName) {
      message.warning('请先填写导入后的根分类名称');
      return;
    }
    if (!selectedBookmarks.length) {
      message.warning('请至少选择一条书签再保存');
      return;
    }

    setSaving(true);
    setProgress(0);
    setSaveErrors([]);
    setSaveSummary(null);

    const totalSteps = 1 + requiredFolders.length + selectedBookmarks.length;
    let finishedSteps = 0;
    const tickProgress = () => {
      finishedSteps += 1;
      setProgress(Math.round((finishedSteps / totalSteps) * 100));
    };

    try {
      const rootResponse = await request({
        url: API_CATEGORY,
        method: 'POST',
        data: {
          name: finalRootName,
          categoryId: GLOBAL_CATEGORY_ID,
          description: 'Imported from bookmarks HTML',
          showInMenu: true,
          audience: { visibility: 'hide' },
        },
      });
      const rootCategoryId = resolveResponseId(rootResponse);

      if (!rootCategoryId) {
        throw new Error('创建根分类失败');
      }

      tickProgress();

      const folderCategoryIds = new Map<string, string>();
      for (const folder of requiredFolders) {
        const parentCategoryId = folder.parentKey
          ? folderCategoryIds.get(folder.parentKey) || rootCategoryId
          : rootCategoryId;
        const response = await request({
          url: API_CATEGORY,
          method: 'POST',
          data: {
            name: folder.title,
            categoryId: parentCategoryId,
            showInMenu: true,
            audience: { visibility: 'hide' },
          },
        });
        const createdId = resolveResponseId(response);

        if (!createdId) {
          throw new Error(`创建分类 "${folder.title}" 失败`);
        }

        folderCategoryIds.set(folder.key, createdId);
        tickProgress();
      }

      const bookmarkFailures: string[] = [];
      let successCount = 0;
      let failureCount = 0;
      let cursor = 0;
      const tasks = selectedBookmarks.map((bookmark) => ({
        ...bookmark,
        categoryId: bookmark.ancestorFolderKeys.length
          ? folderCategoryIds.get(
              bookmark.ancestorFolderKeys[
                bookmark.ancestorFolderKeys.length - 1
              ],
            ) || rootCategoryId
          : rootCategoryId,
        logo:
          bookmark.icon ||
          (fillMissingLogo ? createFallbackFavicon(bookmark.url) : ''),
      }));

      const worker = async () => {
        while (cursor < tasks.length) {
          const task = tasks[cursor];
          cursor += 1;

          try {
            await request({
              url: API_NAV,
              method: 'POST',
              data: {
                name: task.title,
                href: task.url,
                desc: task.title,
                logo: task.logo,
                categoryId: task.categoryId,
                createTime: task.addDate,
                status: 0,
                audience: { visibility: 'hide' },
              },
            });
            successCount += 1;
          } catch (error: any) {
            failureCount += 1;
            bookmarkFailures.push(
              `${task.title}${error?.message ? `: ${error.message}` : ''}`,
            );
          } finally {
            tickProgress();
          }
        }
      };

      await Promise.all(
        Array.from({
          length: Math.min(4, tasks.length || 1),
        }).map(() => worker()),
      );

      setSaveErrors(bookmarkFailures);
      setSaveSummary({
        rootCategoryId,
        rootCategoryName: finalRootName,
        successCount,
        failureCount,
      });

      if (failureCount > 0) {
        message.warning(
          `导入完成，成功 ${successCount} 条，失败 ${failureCount} 条`,
        );
      } else {
        message.success(`导入完成，共保存 ${successCount} 条书签`);
      }
    } catch (error: any) {
      message.error(error?.message || '导入保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Alert
          type="info"
          showIcon
          message="该页面仅用于 sysadmin 管理隐藏书签导入。导入后的分类和书签都会以隐藏可见性保存，不会出现在公共导航中。"
        />

        <Card>
          <Space
            direction="vertical"
            size={16}
            style={{ display: 'flex', width: '100%' }}
          >
            <Upload.Dragger
              beforeUpload={handleFileUpload}
              showUploadList={false}
              accept=".html,.htm,text/html"
              disabled={saving}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">上传浏览器导出的书签 HTML 文件</p>
              <p className="ant-upload-hint">
                支持 Chrome、Edge、Safari、Firefox 等常见导出格式
              </p>
            </Upload.Dragger>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="文件夹"
                    value={importIndex.folders.length}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="书签"
                    value={importIndex.bookmarks.length}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="已选择书签"
                    value={selectedBookmarks.length}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Input
                  value={rootCategoryName}
                  onChange={(event) => setRootCategoryName(event.target.value)}
                  placeholder="导入后的根分类名称"
                  disabled={saving}
                  addonBefore="根分类"
                />
              </Col>
              <Col xs={24} md={10}>
                <Space>
                  <span>补全缺失图标</span>
                  <Switch
                    checked={fillMissingLogo}
                    onChange={setFillMissingLogo}
                    disabled={saving}
                  />
                </Space>
              </Col>
            </Row>

            <Space wrap>
              <Button
                onClick={() => setCheckedKeys(importIndex.allKeys)}
                disabled={!importIndex.allKeys.length || saving}
              >
                全选
              </Button>
              <Button
                onClick={() => setCheckedKeys([])}
                disabled={!importIndex.allKeys.length || saving}
              >
                清空选择
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setExpandedKeys(importIndex.defaultExpandedKeys)}
                disabled={!importIndex.allKeys.length || saving}
              >
                重置展开
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                disabled={!selectedBookmarks.length}
                loading={saving}
              >
                保存已选择书签
              </Button>
            </Space>

            {saving ? <Progress percent={progress} /> : null}
          </Space>
        </Card>

        {!importNodes.length ? (
          <Card>
            <Empty description="上传 HTML 文件后，在这里预览并筛选要保存的书签" />
          </Card>
        ) : (
          <Row gutter={16} align="stretch">
            <Col xs={24} xl={10}>
              <Card
                title="导入树"
                extra={
                  <Typography.Text type="secondary">
                    勾选书签或整个文件夹，系统只会保存选中的书签和必需的目录层级
                  </Typography.Text>
                }
              >
                <Tree
                  checkable
                  blockNode
                  showLine
                  selectable
                  height={640}
                  treeData={treeData}
                  checkedKeys={checkedKeys}
                  expandedKeys={expandedKeys}
                  selectedKeys={selectedKey ? [selectedKey] : []}
                  onCheck={(keys) =>
                    setCheckedKeys(
                      (Array.isArray(keys) ? keys : keys.checked).map((key) =>
                        String(key),
                      ),
                    )
                  }
                  onExpand={(keys) =>
                    setExpandedKeys(keys.map((key) => String(key)))
                  }
                  onSelect={(keys) =>
                    setSelectedKey(keys[0] as string | undefined)
                  }
                />
              </Card>
            </Col>
            <Col xs={24} xl={14}>
              <Space direction="vertical" size={16} style={{ display: 'flex' }}>
                <Card title="节点详情">
                  {activeNode ? (
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="类型">
                        {activeNode.type === 'folder' ? '文件夹' : '书签'}
                      </Descriptions.Item>
                      <Descriptions.Item label="名称">
                        {activeNode.title}
                      </Descriptions.Item>
                      <Descriptions.Item label="路径">
                        {activeNode.pathLabels.join(' / ')}
                      </Descriptions.Item>
                      {activeNode.type === 'bookmark' ? (
                        <Descriptions.Item label="链接">
                          <Typography.Text copyable>
                            {activeNode.url}
                          </Typography.Text>
                        </Descriptions.Item>
                      ) : (
                        <Descriptions.Item label="子项数量">
                          {activeNode.children.length}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="从左侧选择一个节点查看详情"
                    />
                  )}
                </Card>

                <Card
                  title="待保存书签"
                  extra={
                    <Typography.Text type="secondary">
                      必需目录: {requiredFolders.length} 个
                    </Typography.Text>
                  }
                >
                  <Table<BookmarkImportBookmark>
                    rowKey="key"
                    columns={selectedTableColumns}
                    dataSource={selectedBookmarks}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                  />
                </Card>

                {saveSummary ? (
                  <Alert
                    type={saveSummary.failureCount > 0 ? 'warning' : 'success'}
                    showIcon
                    message={`已创建隐藏根分类「${saveSummary.rootCategoryName}」`}
                    description={`分类 ID: ${saveSummary.rootCategoryId}，成功保存 ${saveSummary.successCount} 条书签，失败 ${saveSummary.failureCount} 条。`}
                  />
                ) : null}

                {saveErrors.length ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="以下书签保存失败"
                    description={
                      <Space direction="vertical" size={4}>
                        {saveErrors.slice(0, 8).map((item) => (
                          <Typography.Text key={item}>{item}</Typography.Text>
                        ))}
                        {saveErrors.length > 8 ? (
                          <Typography.Text type="secondary">
                            其余 {saveErrors.length - 8} 条失败记录已省略
                          </Typography.Text>
                        ) : null}
                      </Space>
                    }
                  />
                ) : null}
              </Space>
            </Col>
          </Row>
        )}
      </Space>
    </PageContainer>
  );
}
