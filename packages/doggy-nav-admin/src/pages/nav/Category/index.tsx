import TableCom from '@/components/TableCom';
import useTableComPopup from '@/components/TableCom/useTableComPopup';
import CategoryForm from '@/pages/nav/Category/CategoryForm';
import { API_CATEGORY, API_CATEGORY_LIST } from '@/services/api';
import { CategoryModel } from '@/types/api';
import { getIconComponent } from '@/utils/helpers';
import request from '@/utils/request';
import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-table';
import { Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';

function transformCategoryList(list: any) {
  const newList: any = [];
  list.map((item) => {
    const listItem: any = { key: item.id, ...item, children: [] };
    if (Array.isArray(item.children)) {
      item.children.map((subItem) => {
        listItem.children.push({ key: subItem.id, ...subItem });
        return subItem;
      });
    }
    newList.push(listItem);
    return item;
  });
  return newList;
}

export default function NavAuditListPage() {
  const formProps = useTableComPopup();
  const tableRef = useRef<ActionType>();
  const [categoryList, setCategoryList] = useState<{ key: string }[]>([]);

  async function onRequestData() {
    const res = await request({
      url: API_CATEGORY_LIST,
      method: 'GET',
    });
    const data = transformCategoryList(res.data);
    setCategoryList(data);
    return {
      data,
    };
  }

  async function onDelete(id: string, action: any) {
    await request({
      url: API_CATEGORY,
      method: 'DELETE',
      data: {
        id,
      },
      msg: '删除成功',
    });
    action.reload();
  }

  const columns: ProColumns[] = [
    {
      title: '分类名',
      dataIndex: 'name',
      render: (_text, record) => (
        <>
          <span style={{ marginRight: '4px' }}>
            {getIconComponent(record.icon)}
          </span>
          <span>{record.name}</span>
        </>
      ),
    },
    {
      title: '显示在菜单',
      dataIndex: 'showInMenu',
      valueType: 'select',
      valueEnum: {
        true: { text: '显示', status: 'Success' },
        false: { text: '不显示', status: 'Error' },
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '显示在菜单',
      dataIndex: 'createAtDate',
    },
  ];
  return (
    <>
      <TableCom
        actionRef={tableRef}
        columns={columns}
        search={false}
        request={onRequestData}
        toolbar={{
          actions: [
            <Button
              key="add"
              type="primary"
              onClick={() => formProps.show()}
              icon={<PlusOutlined />}
            >
              添加分类
            </Button>,
          ],
        }}
        renderOptions={(text, record: CategoryModel, _, action) => [
          <a
            key="edit"
            onClick={() =>
              formProps.show({ type: 'edit', data: record, action })
            }
          >
            编辑
          </a>,
          <Popconfirm
            key="delete"
            title={'确定删除吗？'}
            onConfirm={() => onDelete(record.id, action)}
          >
            <a>删除</a>
          </Popconfirm>,
        ]}
      />
      <CategoryForm
        {...formProps}
        tableRef={tableRef.current}
        categoryList={categoryList}
      />
    </>
  );
}
