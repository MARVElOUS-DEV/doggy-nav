import TableCom from '@/components/TableCom';
import useTableComPopup from '@/components/TableCom/useTableComPopup';
import CategorySelect from '@/pages/nav/Category/CategorySelect';
import NavListForm from '@/pages/nav/List/NavListForm';
import TagSelect from '@/pages/nav/Tag/TagSelect';
import NavTagList from '@/pages/nav/components/NavTagList';
import { API_CATEGORY, API_NAV, API_NAV_LIST } from '@/services/api';
import request from '@/utils/request';
import { formatDateTime } from '@/utils/time';
import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { ProColumns } from '@ant-design/pro-table';
import { history, useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  message,
  Modal,
  Popconfirm,
  Space,
  Tooltip,
} from 'antd';
import { useRef, useState } from 'react';

export default function NavListPage() {
  const access = useAccess();
  const tableRef = useRef<any>();
  const formProps = useTableComPopup();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupCategoryId, setCleanupCategoryId] = useState<string>();
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const handleCategoryCleanup = async () => {
    if (!cleanupCategoryId) return;

    setCleanupLoading(true);
    try {
      const response = await request({
        url: API_CATEGORY,
        method: 'DELETE',
        data: { id: cleanupCategoryId, cascade: true },
      });
      const deletedNavs = Number(response?.data?.deletedNavs || 0);
      const deletedCategories = Number(response?.data?.deletedCategories || 0);

      message.success(
        `清理完成：删除 ${deletedNavs} 个导航项目和 ${deletedCategories} 个分类`,
      );
      setCleanupOpen(false);
      setCleanupCategoryId(undefined);
      setSelectedRowKeys([]);
      tableRef.current?.reload();
    } catch {
      message.error('分类清理失败，请重试');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的项目');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个项目吗？此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // Create array of delete requests
          const deleteRequests = selectedRowKeys.map((id) =>
            request({
              url: API_NAV,
              method: 'DELETE',
              data: { id },
            }),
          );

          // Execute all delete requests
          await Promise.all(deleteRequests);

          message.success(`成功删除 ${selectedRowKeys.length} 个项目`);
          setSelectedRowKeys([]);
          tableRef.current?.reload();
        } catch (error) {
          message.error('批量删除失败，请重试');
        }
      },
    });
  };

  const columns: ProColumns[] = [
    {
      title: '网站名称',
      dataIndex: 'name',
    },
    {
      title: '网站标签',
      dataIndex: 'tags',
      width: 250,
      ellipsis: false,
      renderFormItem: (props) => <TagSelect {...props} mode="multiple" />,
      renderText: (text, record) => <NavTagList tags={record.tags} />,
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      hideInTable: true,
      renderFormItem: (props) => <CategorySelect {...props} />,
    },
    {
      title: '网站描述',
      dataIndex: 'desc',
      search: false,
      width: 500,
    },
    {
      title: '网站链接',
      dataIndex: 'href',
      search: false,
    },
    // Audience visibility shown as text
    {
      title: '可见性',
      dataIndex: ['audience', 'visibility'],
      search: false,
      width: 120,
      valueEnum: {
        public: { text: '公开' },
        authenticated: { text: '登录可见' },
        restricted: { text: '受限' },
        hide: { text: '隐藏' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTimeDate',
      search: false,
      renderText: (v) => formatDateTime(v),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  return (
    <>
      <TableCom
        actionRef={tableRef}
        columns={columns}
        requestParams={{ url: API_NAV_LIST, method: 'GET' }}
        showPageHeader={false}
        scroll={{ x: 'max-content' }}
        rowSelection={rowSelection}
        toolbar={{
          actions: [
            <Button
              key="add-nav"
              type="primary"
              onClick={() => formProps.show()}
            >
              添加导航
            </Button>,
            <Button
              key="batch-delete"
              type="primary"
              danger
              // icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>,
            access.isSysadmin ? (
              <Button
                key="category-cleanup"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setCleanupOpen(true)}
              >
                按分类清理
              </Button>
            ) : null,
          ],
        }}
        renderOptions={(_, record, __, action) =>
          record.status !== 2
            ? [
                <a
                  key="edit"
                  onClick={() =>
                    formProps.show({ action, data: record, type: 'edit' })
                  }
                >
                  编辑
                </a>,
                <Tooltip key="edit-detail" title="编辑详情">
                  <Button
                    type="text"
                    size="small"
                    icon={<FileTextOutlined />}
                    key="edit-detail"
                    onClick={() =>
                      history.push(`/nav/list/${record.id}/detail`)
                    }
                  />
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title={'确定删除吗?'}
                  onConfirm={async () => {
                    await request({
                      url: API_NAV,
                      method: 'DELETE',
                      data: {
                        id: record?.id,
                      },
                      msg: '删除成功',
                    });
                    action.reload();
                  }}
                >
                  <a>删除</a>
                </Popconfirm>,
              ]
            : []
        }
      />
      <NavListForm {...formProps} tableRef={tableRef.current} />
      <Modal
        title="清理分类及全部内容"
        width={720}
        open={cleanupOpen}
        okText="确认全部删除"
        okType="danger"
        cancelText="取消"
        confirmLoading={cleanupLoading}
        okButtonProps={{ disabled: !cleanupCategoryId }}
        onOk={handleCategoryCleanup}
        onCancel={() => {
          if (!cleanupLoading) {
            setCleanupOpen(false);
            setCleanupCategoryId(undefined);
          }
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="将删除所选分类、全部子分类，以及其中的所有导航项目。此操作不可恢复。"
          />
          <CategorySelect
            value={cleanupCategoryId}
            onChange={setCleanupCategoryId}
            placeholder="选择要彻底清理的导入根分类"
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
    </>
  );
}
