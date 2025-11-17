import TableCom from '@/components/TableCom';
import useTableComPopup from '@/components/TableCom/useTableComPopup';
import CategorySelect from '@/pages/nav/Category/CategorySelect';
import NavListForm from '@/pages/nav/List/NavListForm';
import { API_NAV, API_NAV_LIST } from '@/services/api';
import request from '@/utils/request';
import { formatDateTime } from '@/utils/time';
import { ProColumns } from '@ant-design/pro-table';
import { Button, message, Modal, Popconfirm, Space, Tag } from 'antd';
import { useRef, useState } from 'react';

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

export default function NavListPage() {
  const tableRef = useRef<any>();
  const formProps = useTableComPopup();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
      search: false,
      width: 250,
      renderText: (text, record) => (
        <Space>
          {record.tags?.map((item) => (
            <RandomColorTag key={item}>{item}</RandomColorTag>
          ))}
        </Space>
      ),
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
    </>
  );
}
