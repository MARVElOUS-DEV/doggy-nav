import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { ActionType, ProTable } from '@ant-design/pro-table';
import { Access, useRequest } from '@umijs/max';
import { Button, Space, Modal, Avatar } from 'antd';
import React, { useRef, useState } from "react";
import { SmileOutlined, FrownOutlined, ExclamationCircleFilled, UserOutlined } from '@ant-design/icons';
import AddOrEdit from "@/pages/user/addOrEdit";

const UserPage: React.FC = () => {
    const actionRef = useRef<ActionType>();
    const [selectedRows, setSelectedRows] = useState<User.UserItem[]>([]);

    const [id, setId] = useState<string>('');
    const [drawerVisible, setDrawerVisible] = useState(false)

    const {loading: deleteLoading, run: batchDelete} = useRequest(
        (ids: string[]) => {
            return {
                method: 'DELETE',
                url: `/api/user`,
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
            icon: <ExclamationCircleFilled/>,
            content: `确定要删除所选项吗？`,
            onOk() {
                batchDelete(ids)
            }
        });
    }
    const handleEdit = (record: User.UserItem) => {
        setId(record.id)
        setDrawerVisible(true)
    }
    const renderActions = (_text: string, record: User.UserItem) => (
        <Space>
            <Button type="link" onClick={() => handleEdit(record)}>
                编辑
            </Button>
            <Button type="text" loading={deleteLoading} danger onClick={() => handleDelete([record.id])}>
                删除
            </Button>
        </Space>
    );
    const columns: any[] = [
        {
            title: '账号',
            dataIndex: 'account',
        },
        {
            title: '状态',
            dataIndex: 'status',
            valueEnum: {
                1: {
                    text: '正常',
                    status: 'Success',
                    icon: <SmileOutlined/>,
                },
                0: {
                    text: '禁用',
                    status: 'Error',
                    icon: <FrownOutlined/>,
                }
            },
        },
        {
            title: '昵称',
            dataIndex: 'nickName',
            hideInSearch: true
        },
        {
            title: '角色',
            dataIndex: 'roles',
            render: (roles: string[]) => {
                if (!roles || !Array.isArray(roles)) return '-';
                return roles.join(', ');
            }
        },
        {
            title: 'Email',
            dataIndex: 'email'
        },
        {
            title: '头像',
            dataIndex: 'avatar',
            hideInSearch: true,
            render: (avatar: string, user: User.UserItem) => {
                const valid = typeof avatar === 'string'
                  && avatar.trim() !== ''
                  && avatar.trim() !== '-'
                  && /^(https?:|data:|\/)/.test(avatar);
                return valid
                  ? <Avatar src={avatar} alt={user.nickName} size={40} />
                  : <Avatar icon={<UserOutlined />} size={40} />;
            }
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
            url: '/api/user',
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
            <ProTable<User.UserItem>
                scroll={{ x: 'max-content' }}
                actionRef={actionRef}
                loading={loading}
                rowKey="id"
                search={{
                    labelWidth: 60,
                }}
                toolBarRender={() => [
                    <Access accessible key='add'>
                        <Button
                            key="add"
                            type="primary"
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
                    const {list, total} = await run(params);
                    return {
                        data: list || [],
                        total: total || 0,
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
                    <Access accessible key='add'>
                        <Button
                            type="primary" danger
                            onClick={async () => {
                                handleDelete(selectedRows.map(item => item.id))
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

export default UserPage;