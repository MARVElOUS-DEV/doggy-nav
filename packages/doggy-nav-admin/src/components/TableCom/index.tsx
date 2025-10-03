import type { ReactNode } from 'react';
import React, { useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { ProColumns, ProTableProps } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { PageContainer, PageContainerProps } from '@ant-design/pro-layout';
import { Dropdown, Menu, Tooltip, Button } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, MoreOutlined } from '@ant-design/icons';
import request from "@/utils/request";

interface TableComProps extends ProTableProps<any, any> {
  showPageHeader?: boolean;
  PageContainerProps?: PageContainerProps;
  requestParams?: any;
  defaultRequestData?: object
  renderOptions?: (text: ReactNode, record: any, _: any, action: any) => ReactNode[];
}

function TableCom(props: TableComProps, ref: any) {
  const {
    showPageHeader = false,
    PageContainerProps = {},
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

  async function onRequest(
    params: any
  ): Promise<Partial<{ data: any[]; total: number; success: boolean }>> {
    setLoading(true);
    try {
      const { url, pageSize, current } = params;
      delete params.url;
      delete params.pageSize;
      delete params.current;

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
      return {
        data: res?.data?.data ?? [],
        total: res?.data?.total ?? 0,
        success: true,
      };
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  }

  function formatOptions(options: any[], maxCount = 3) {
    // Function to convert text operations to icon buttons
    const convertToIconButton = (option: any) => {
      // If it's already a react element (like Popconfirm with <a> children), process it
      if (React.isValidElement(option)) {
        const element = option as React.ReactElement;

        // If the element is a Popconfirm or similar with <a> or text button children
        if (element.props.children) {
          const children = element.props.children;

          // Handle case where children is a string (like <a>操作名</a>)
          if (typeof children === 'string') {
            let icon: React.ReactNode | undefined;
            let text = children;

            // Detect common operation texts and assign appropriate icons
            if (children.includes('编辑') || children.includes('Edit')) {
              icon = <EditOutlined />;
            } else if (children.includes('删除') || children.includes('Delete')) {
              icon = <DeleteOutlined />;
            } else if (children.includes('通过') || children.includes('Approve') || children.includes('Yes')) {
              icon = <CheckOutlined />;
            } else if (children.includes('拒绝') || children.includes('Reject') || children.includes('No')) {
              icon = <CloseOutlined />;
            } else {
              // If no specific icon detected, return original element
              return option;
            }

            // Create a new button element while preserving all original props
            const buttonElement = (
              <Button
                type="text"
                icon={icon}
                size="small"
                title={text}
                style={{ padding: '4px', margin: '0 2px' }}
              />
            );

            // Return the original wrapper (like Popconfirm) with the new button as children
            return React.cloneElement(element, {
              children: buttonElement
            });
          }
          // If children is also a React element, recursively process it
          else if (React.isValidElement(children)) {
            return React.cloneElement(element, {
              children: convertToIconButton(children)
            });
          }
        }
        return option;
      }

      // If it's a string, create an appropriate icon button
      if (typeof option === 'string') {
        let icon: React.ReactNode | undefined;
        let title = option;

        if (option.includes('编辑') || option.includes('Edit')) {
          icon = <EditOutlined />;
        } else if (option.includes('删除') || option.includes('Delete')) {
          icon = <DeleteOutlined />;
        } else if (option.includes('通过') || option.includes('Approve') || option.includes('Yes')) {
          icon = <CheckOutlined />;
        } else if (option.includes('拒绝') || option.includes('Reject') || option.includes('No')) {
          icon = <CloseOutlined />;
        } else {
          // If no specific icon detected, return as a simple text button
          return (
            <Button
              key={`text-${Math.random()}`}
              type="text"
              size="small"
              style={{ padding: '4px', margin: '0 2px' }}
            >
              {option}
            </Button>
          );
        }

        return (
          <Tooltip key={`tooltip-${Math.random()}`} title={title}>
            <Button
              type="text"
              icon={icon}
              size="small"
              title={title}
              style={{ padding: '4px', margin: '0 2px' }}
            />
          </Tooltip>
        );
      }

      return option;
    };

    if (options.length >= maxCount) {
      const moreOptions = options.splice(maxCount-1);

      return [
        ...options.map((option, index) => (
          <span key={`option-${index}`} style={{ margin: '0 2px' }}>
            {convertToIconButton(option)}
          </span>
        )),
        <Dropdown
          key="dropdown-more"
          overlay={
            <Menu>
              {moreOptions.map((item, index) => (
                <Menu.Item key={`more-${index}`}>
                  {convertToIconButton(item)}
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{ padding: '4px', margin: '0 2px' }}
          />
        </Dropdown>,
      ];
    }

    return options.map((option, index) => (
      <span key={`span-${index}`} style={{ margin: '0 2px' }}>
        {convertToIconButton(option)}
      </span>
    ));
  }

  const realColumns  = useMemo<ProColumns[]>(() => {
    // Process columns to add height restrictions, ellipsis, and optimized widths
    const processedColumns = columns.map((column: ProColumns) => {
      // Determine optimized width based on column type
      let optimizedWidth = column.width;
      if (!optimizedWidth) {
        // Set default widths based on common column types
        if (column.dataIndex === 'createTime' || column.dataIndex === 'updateTime' || column.valueType === 'dateTime' || column.valueType === 'date') {
          optimizedWidth = 180; // DateTime columns need more space
        } else if (column.dataIndex === 'status') {
          optimizedWidth = 100; // Status columns are usually compact
        } else if (column.dataIndex === 'name' || column.dataIndex === 'title') {
          optimizedWidth = 200; // Name columns often need moderate space
        } else if (column.dataIndex === 'desc' || column.dataIndex === 'description') {
          optimizedWidth = 300; // Description columns need more space but will be truncated
        } else {
          optimizedWidth = 150; // Default width for most columns
        }
      }

      // Only apply height restriction to text-based columns
      if (!column.valueType || ['text', 'textarea', 'select', undefined].includes(column.valueType as string)) {
        return {
          ...column,
          width: optimizedWidth,
          render: (dom: any, record: any, index: number, action: any, schema: any) => {
            // Original render function if exists
            const originalRender = typeof column.render === 'function'
              ? column.render(dom, record, index, action, schema)
              : dom;

            // If it's a string or number and needs ellipsis (but not for specific value types like progress bars)
            if ((typeof originalRender === 'string' || typeof originalRender === 'number') &&
                column.valueType !== 'progress' &&
                column.valueType !== 'image' &&
                column.valueType !== 'avatar' &&
                !column.render) { // Only apply to default renders, not custom ones
              const content = String(originalRender);
              // Create a div with max-height and overflow to restrict to 2 lines
              return (
                <Tooltip title={content} placement="topLeft">
                  <div
                    style={{
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '20px'
                    }}
                  >
                    {content}
                  </div>
                </Tooltip>
              );
            }
            return originalRender;
          }
        };
      } else {
        // For non-text columns, just set optimized width
        return {
          ...column,
          width: optimizedWidth
        };
      }
    });

    if (renderOptions) {
      return [
        ...processedColumns,
        {
          title: '操作',
          valueType: 'option',
          width: 150,
          fixed: 'right',
          render: (text, record, _, action)=> formatOptions(renderOptions(text, record, _, action))
        }
      ]
    }
    return processedColumns;
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

  if (!showPageHeader) {
    return (
    <>
      {proTable}
      {children}
    </>
  );
  }

  return (
    <PageContainer {...PageContainerProps}>
      {proTable}
      {children}
    </PageContainer>
  );
}

export default React.forwardRef(TableCom);
