import request from '@/utils/request';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { PageContainer, PageContainerProps } from '@ant-design/pro-layout';
import type { ProColumns, ProTableProps } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

interface TableComProps extends ProTableProps<any, any> {
  showPageHeader?: boolean;
  PageContainerProps?: PageContainerProps;
  requestParams?: any;
  defaultRequestData?: object;
  renderOptions?: (
    text: ReactNode,
    record: any,
    _: any,
    action: any,
  ) => ReactNode[];
}

const MIN_TABLE_WIDTH = 1024;

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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function onRequest(
    params: any,
  ): Promise<Partial<{ data: any[]; total: number; success: boolean }>> {
    if (mountedRef.current) setLoading(true);
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
      if (mountedRef.current) setLoading(false);
      return {
        data: res?.data?.data ?? [],
        total: res?.data?.total ?? 0,
        success: true,
      };
    } catch (err: any) {
      if (mountedRef.current) setLoading(false);
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
            } else if (
              children.includes('删除') ||
              children.includes('Delete')
            ) {
              icon = <DeleteOutlined />;
            } else if (
              children.includes('通过') ||
              children.includes('Approve') ||
              children.includes('Yes')
            ) {
              icon = <CheckOutlined />;
            } else if (
              children.includes('拒绝') ||
              children.includes('Reject') ||
              children.includes('No')
            ) {
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
              children: buttonElement,
            });
          }
          // If children is also a React element, recursively process it
          else if (React.isValidElement(children)) {
            return React.cloneElement(element, {
              children: convertToIconButton(children),
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
        } else if (
          option.includes('通过') ||
          option.includes('Approve') ||
          option.includes('Yes')
        ) {
          icon = <CheckOutlined />;
        } else if (
          option.includes('拒绝') ||
          option.includes('Reject') ||
          option.includes('No')
        ) {
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
      const moreOptions = options.splice(maxCount - 1);

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

  const { realColumns, estimatedWidth } = useMemo<{
    realColumns: ProColumns[];
    estimatedWidth: number;
  }>(() => {
    // Process columns to add height restrictions, ellipsis, and optimized widths
    const processedColumns = columns.map(
      (column: ProColumns, index: number) => {
        const baseColumn: ProColumns = {
          ...column,
          fixed: column.fixed ?? (index === 0 ? 'left' : undefined),
        };
        // Determine optimized width based on column type
        let optimizedWidth = baseColumn.width;
        if (!optimizedWidth) {
          // Set default widths based on common column types
          if (
            baseColumn.dataIndex === 'createTime' ||
            baseColumn.dataIndex === 'updateTime' ||
            baseColumn.valueType === 'dateTime' ||
            baseColumn.valueType === 'date'
          ) {
            optimizedWidth = 180; // DateTime columns need more space
          } else if (baseColumn.dataIndex === 'status') {
            optimizedWidth = 100; // Status columns are usually compact
          } else if (
            baseColumn.dataIndex === 'name' ||
            baseColumn.dataIndex === 'title'
          ) {
            optimizedWidth = 200; // Name columns often need moderate space
          } else if (
            baseColumn.dataIndex === 'desc' ||
            baseColumn.dataIndex === 'description'
          ) {
            optimizedWidth = 300; // Description columns need more space but will be truncated
          } else {
            optimizedWidth = 150; // Default width for most columns
          }
        }

        // Only apply height restriction to text-based columns
        if (
          !baseColumn.valueType ||
          ['text', 'textarea', 'select', undefined].includes(
            baseColumn.valueType as string,
          )
        ) {
          return {
            ...baseColumn,
            width: optimizedWidth,
            ellipsis: baseColumn.ellipsis ?? true,
            render: (
              dom: any,
              record: any,
              index: number,
              action: any,
              schema: any,
            ) => {
              // Original render function if exists
              const originalRender =
                typeof baseColumn.render === 'function'
                  ? baseColumn.render(dom, record, index, action, schema)
                  : dom;

              // If it's a string or number and needs ellipsis (but not for specific value types like progress bars)
              if (
                (typeof originalRender === 'string' ||
                  typeof originalRender === 'number') &&
                baseColumn.valueType !== 'progress' &&
                baseColumn.valueType !== 'image' &&
                baseColumn.valueType !== 'avatar' &&
                !baseColumn.render
              ) {
                // Only apply to default renders, not custom ones
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
                        lineHeight: '20px',
                      }}
                    >
                      {content}
                    </div>
                  </Tooltip>
                );
              }
              return originalRender;
            },
          };
        } else {
          // For non-text columns, just set optimized width
          return {
            ...baseColumn,
            width: optimizedWidth,
          };
        }
      },
    );

    const actionColumns = renderOptions
      ? [
          ...processedColumns,
          {
            title: '操作',
            valueType: 'option',
            width: 100,
            fixed: 'right',
            render: (text, record, _, action) =>
              formatOptions(renderOptions(text, record, _, action)),
          },
        ]
      : processedColumns;

    const estimatedTableWidth = actionColumns.reduce((total, column) => {
      const widthValue = column?.width;
      if (typeof widthValue === 'number') return total + widthValue;
      if (typeof widthValue === 'string') {
        const parsed = Number.parseInt(widthValue, 10);
        return total + (Number.isNaN(parsed) ? 150 : parsed);
      }
      return total + 150;
    }, 0);

    return { realColumns: actionColumns, estimatedWidth: estimatedTableWidth };
  }, [renderOptions, columns]);

  // Ensure horizontal scroll when columns are fixed to avoid overflow at narrower widths
  const mergedTableProps: ProTableProps<any, any> = { ...proTableProps };
  const shouldApplyScrollWidth =
    !mergedTableProps.scroll ||
    mergedTableProps.scroll.x === undefined ||
    mergedTableProps.scroll.x === 'max-content';

  if (
    shouldApplyScrollWidth ||
    typeof mergedTableProps.scroll?.x === 'number'
  ) {
    const targetWidth = Math.max(estimatedWidth, MIN_TABLE_WIDTH);
    const resolvedScroll = mergedTableProps.scroll || {};
    const existingX = resolvedScroll.x;
    mergedTableProps.scroll = {
      ...resolvedScroll,
      x:
        typeof existingX === 'number' && !shouldApplyScrollWidth
          ? Math.max(existingX, targetWidth)
          : targetWidth,
    };
  }
  // A fixed table layout helps keep cells within bounds when widths are constrained
  if (!('tableLayout' in mergedTableProps)) {
    mergedTableProps.tableLayout = 'fixed';
  }

  const { request: incomingRequest, ...restTableProps } = mergedTableProps;
  const resolvedRequest =
    incomingRequest ?? (requestParams?.url ? onRequest : undefined);

  const proTable = (
    <ProTable
      columns={realColumns}
      loading={loading}
      formRef={from}
      request={resolvedRequest}
      rowSelection={{ type: 'checkbox' }}
      rowKey={'id'}
      {...restTableProps}
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
