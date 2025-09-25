import { API_NAV, API_NAV_LIST } from "@/services/api";
import GeekProTable from "@/components/TableCom";
import { ProColumns } from "@ant-design/pro-table";
import useGeekProTablePopup from "@/components/TableCom/useTableComPopup";
import NavListForm from "@/pages/nav/List/NavListForm";
import { Popconfirm, Tag, Space, Button } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import request from "@/utils/request";
import { useRef } from "react";
import CategorySelect from "@/pages/nav/Category/CategorySelect";

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
    'geekblue',
    'purple',
  ]
  return <Tag color={colors[Math.floor(Math.random() * colors.length)]}>{children}</Tag>
}

export default function NavListPage() {
  const tableRef = useRef();
  const formProps = useGeekProTablePopup()

  const columns: ProColumns[] = [
    {
      title: '网站名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '网站标签',
      dataIndex: 'tags',
      search: false,
      width: 250,
      renderText: (text, record) => (
        <Space>
          {record.tags?.map(item => <RandomColorTag key={item}>{item}</RandomColorTag>)}
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      width: 500,
      hideInTable: true,
      renderFormItem: (props) => <CategorySelect {...props} />
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
    {
      title: '创建时间',
      dataIndex: 'createTime',
      search: false,
      valueType: 'dateTime'
    },
  ]

  return (
    <>
      <div className="table-container">
        <GeekProTable
          actionRef={tableRef}
          columns={columns}
          requestParams={{url: API_NAV_LIST, method: 'GET'}}
          showPageHeader={false}
          scroll={{ x: 'max-content' }}
          renderOptions={(text, record, _, action) => record.status != 2 ? [
            <a onClick={() => formProps.show({action, data: record, type: 'edit'})}>编辑</a>,
            <Popconfirm
              title={'确定删除吗?'}
              onConfirm={async () => {
                await request({
                  url: API_NAV,
                  method: 'DELETE',
                  data: {
                    id: record?._id
                  },
                  msg: '删除成功'
                })
                action.reload()
              }}>
              <a>删除</a>
            </Popconfirm>,
          ] : []}></GeekProTable>
      </div>
      <NavListForm {...formProps} tableRef={tableRef.current} />
    </>
  )
}
