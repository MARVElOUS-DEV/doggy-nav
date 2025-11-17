import TableCom from '@/components/TableCom';
import { API_NAV_AUDIT, API_NAV_LIST } from '@/services/api';
import { NavStatus } from '@/types/api';
import request from '@/utils/request';
import { formatDateTime } from '@/utils/time';
import { ActionType, ProColumns } from '@ant-design/pro-table';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import React from 'react';

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

export default function NavAuditListPage() {
  const actionRef = React.useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);

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

  return (
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
  );
}
