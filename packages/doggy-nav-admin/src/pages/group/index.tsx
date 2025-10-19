import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { ActionType, ProTable } from '@ant-design/pro-table';
import { Access, useRequest } from '@umijs/max';
import { Button, Space, Modal } from 'antd';
import React, { useRef, useState } from "react";
import { PlusOutlined } from '@ant-design/icons';
import AddOrEdit from "@/pages/group/addOrEdit";

const GroupPage: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [selectedRows, setSelectedRows] = useState<Group.GroupItem[]>([]);

    const [id, setId] = useState<string>('');
    const [drawerVisible, setDrawerVisible] = useState(false)

    const {loading: deleteLoading, run: batchDelete} = useRequest(
        (ids: string[]) => {
            return {
                method: 'DELETE',
                url: '/api/groups',
                data: {ids},
            }
        },
        {
            manual: true,
            onSuccess: () => {
                setSelectedRows([]);
                actionRef?.current?.reloadAndRest?.();
            }
        });

    const handleDelete = (ids: string[]) => {
        Modal.confirm({
            title: '温馨提示',
            content: `确定要删除所选项吗？`,
            onOk() {
                batchDelete(ids)
            }
        });
    }
    const handleEdit = (record) => {
        setId(record._id)
        setDrawerVisible(true)
    }
    const renderActions = (text: string, record) => (
        <Space>
            <Button type="link" onClick={() => handleEdit(record)}>
                编辑
            </Button>
            <Button type="text" loading={deleteLoading} danger onClick={() => handleDelete([record._id])}>
                删除
            </Button>
        </Space>
    );
    const columns: any[] = [
        {
            title: '名称',
            dataIndex: 'slug',
        },
        {
            title: '显示名称',
            dataIndex: 'displayName',
            hideInSearch: true
        },
        {
            title: '标识',
            dataIndex: 'slug',
            hideInSearch: true
        },
        {
            title: '描述',
            dataIndex: 'description',
            hideInSearch: true,
            ellipsis: true,
        },
        {
            title: '创建时间',
            hideInSearch: true,
            dataIndex: 'createdAt'
        },
        {
            title: '更新时间',
            hideInSearch: true,
            dataIndex: 'updatedAt'
        },
        {
            title: '操作',
            valueType: 'option',
            render: renderActions,
        },
    ]

    const {loading, run} = useRequest((params) => {
        return {
            method: 'GET',
            url: '/api/groups',
            params,
        }
    }, {
        manual: true
    });
    return (
        <PageContainer header={{title: false}}>
            {
                drawerVisible ? <AddOrEdit setDrawerVisible={setDrawerVisible} id={id} actionRef={actionRef}/> : null
            }
            <ProTable<Group.GroupItem>
                scroll={{ x: 'max-content' }}
                actionRef={actionRef}
                loading={loading}
                rowKey="_id"
                search={{
                    labelWidth: 60,
                }}
                toolBarRender={() => [
                    <Access accessible key='add'>
                        <Button
                            key="add"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setId('')
                                setDrawerVisible(true)
                            }}
                        >
                            新建
                        </Button>,
                    </Access>
                ]}
                request={async (params) => {
                    const response = await run(params);
                    return {
                        data: response?.data || [],
                        total: response?.total || 0,
                    };
                }}
                columns={columns}
                rowSelection={{
                    onChange: (_, selectedRows) => setSelectedRows(selectedRows),
                }}
            />
            {selectedRows?.length > 0 && (
                <FooterToolbar
                    extra={
                        <div>
                            已选择{' '}
                            <a style={{fontWeight: 600}}>{selectedRows.length}</a>{' '}
                            项&nbsp;&nbsp;
                        </div>
                    }
                >
                    <Access accessible key='delete'>
                        <Button
                            type="primary" danger
                            onClick={async () => {
                                handleDelete(selectedRows.map(item => item._id))
                            }}
                        >
                            批量删除
                        </Button>
                    </Access>
                </FooterToolbar>
            )}
        </PageContainer>
    );
};

export default GroupPage;