import type { ReactNode } from 'react';
import React, { useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { ProColumns, ProTableProps } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import type { PageHeaderProps } from 'antd';
import { Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import request from "@/utils/request";

interface GeekProTableProps extends ProTableProps<any, any> {
  showPageHeader?: boolean;
  pageHeaderProps?: PageHeaderProps;
  requestParams?: any;
  defaultRequestData?: object
  renderOptions?: (text: ReactNode, record: any, _: any, action: any) => ReactNode[];
}

function GeekProTable(props: GeekProTableProps, ref: any) {
  const {
    showPageHeader = true,
    pageHeaderProps = {},
    requestParams = {},
    defaultRequestData = {},
    columns = [],
    children,
    renderOptions,
    ...proTableProps
  } = props;

  const from = useRef();
  useImperativeHandle(ref, () => ({ from: from.current }), []);

  const [loading, setLoading] = useState(false);

  const realColumns  = useMemo<ProColumns[]>(() => {
    if (renderOptions) {
      return [
        ...columns,
        {
          title: '操作',
          valueType: 'option',
          render: (text, record, _, action)=> formatOptions(renderOptions(text, record, _, action))
        }
      ]
    }
    return columns
  }, [renderOptions, columns]);

  const proTable = (
    <ProTable
      columns={realColumns}
      loading={loading}
      formRef={from}
      request={proTableProps.request || onRequest}
      rowSelection={{type: 'checkbox'}}
      rowKey={'_id'}
      {...proTableProps}
    />
  );

  async function onRequest(params: any) {
    setLoading(true);
    try {
      const { url, pageSize, current } = params
      delete params.url
      delete params.pageSize
      delete params.current

      const res: any = await request({
        url,
        ...requestParams,
        data: {
          pageSize,
          pageNumber: current,
          ...defaultRequestData,
          ...params,
        },
      });
      setLoading(false);
      // const resData = parseListData(res);
      return {
        data: res?.data?.data,
        total: res?.data?.total,
      };
    } catch (err: any) {
      console.error(err)
    }
  }

  if (!showPageHeader) {
    return proTable;
  }

  return (
    <PageHeaderWrapper {...pageHeaderProps}>
      {proTable}
      {children}
    </PageHeaderWrapper>
  );
}

function formatOptions(options: any[], maxCount = 3) {
  if (options.length >= maxCount) {
    const moreOptions = options.splice(maxCount-1);

    return [
      ...options,
      <Dropdown
        overlay={
          <Menu>
            {moreOptions.map(item => (
              <Menu.Item key={item}>{item}</Menu.Item>
            ))}
          </Menu>
        }
        trigger={['click']}
      >
        <a>
          更多操作
          <DownOutlined />
        </a>
      </Dropdown>,
    ];
  }

  return options;
}

export default React.forwardRef(GeekProTable);
