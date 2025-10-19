import { Modal, Form, message } from "antd";
import { useRequest } from "@umijs/max";
import React, { useEffect } from "react";
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-form';
import { getRoles } from '@/services/api';

interface AddOrEditProps {
    setDrawerVisible: (visible: boolean) => void;
    id?: string;
    actionRef?: any;
}

const AddOrEdit: React.FC<AddOrEditProps> = ({ setDrawerVisible, id, actionRef }) => {
    const [form] = Form.useForm();
    const { data: rolesResp } = useRequest(getRoles, { manual: false });

    const { loading: detailLoading, run: getDetail } = useRequest(
        (id: string) => ({
            method: 'GET',
            url: `/api/groups/${id}`,
        }),
        {
            manual: true,
            onSuccess: (data) => {
                form.setFieldsValue(data?.data);
            }
        }
    );

    const { loading: submitLoading, run: submit } = useRequest(
        (data: any) => ({
            method: id ? 'PUT' : 'POST',
            url: id ? `/api/groups/${id}` : '/api/groups',
            data,
        }),
        {
            manual: true,
            onSuccess: () => {
                message.success(id ? '更新成功' : '创建成功');
                setDrawerVisible(false);
                actionRef?.current?.reloadAndRest?.();
            },
            onError: () => {
                message.error(id ? '更新失败' : '创建失败');
            }
        }
    );

    useEffect(() => {
        if (id) {
            getDetail(id);
        }
    }, [id]);

    const handleSubmit = async (values: any) => {
        await submit(values);
    };

    return (
        <Modal
            title={id ? '编辑分组' : '新建分组'}
            open={true}
            onCancel={() => setDrawerVisible(false)}
            footer={null}
            width={600}
            destroyOnHidden
        >
            <ProForm
                form={form}
                onFinish={handleSubmit}
                loading={submitLoading || detailLoading}
                submitter={{
                    searchConfig: {
                        submitText: '确定',
                        resetText: '取消',
                    },
                    onReset: () => setDrawerVisible(false),
                }}
            >
                <ProFormText
                    name="name"
                    label="名称"
                    placeholder="请输入分组名称"
                    rules={[
                        { required: true, message: '请输入分组名称' },
                        { max: 50, message: '名称不能超过50个字符' }
                    ]}
                />
                <ProFormText
                    name="displayName"
                    label="显示名称"
                    placeholder="请输入显示名称"
                    rules={[
                        { required: true, message: '请输入显示名称' },
                        { max: 100, message: '显示名称不能超过100个字符' }
                    ]}
                />
                <ProFormText
                    name="slug"
                    label="标识"
                    placeholder="请输入分组标识"
                    rules={[
                        { required: true, message: '请输入分组标识' },
                        { pattern: /^[a-zA-Z0-9_-]+$/, message: '标识只能包含字母、数字、下划线和横线' },
                        { max: 50, message: '标识不能超过50个字符' }
                    ]}
                />
                <ProFormText
                    name="description"
                    label="描述"
                    placeholder="请输入分组描述"
                    fieldProps={{
                        maxLength: 500,
                        showCount: true,
                        autoSize: { minRows: 3, maxRows: 6 }
                    }}
                />
            <ProFormSelect
                name={['roles']}
                label="关联角色"
                placeholder="请选择关联角色"
                mode="multiple"
                options={(rolesResp?.data?.data || rolesResp?.data || []).map((r: any) => ({ label: r.displayName || r.slug, value: r._id }))}
                tooltip="选择后，该分组内用户将继承这些角色权限"
            />
            </ProForm>
        </Modal>
    );
};

export default AddOrEdit;