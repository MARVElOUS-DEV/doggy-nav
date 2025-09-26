import {
  DrawerForm,
  ProFormText,
  ProFormSwitch,
  ProFormRadio
} from '@ant-design/pro-form';
import { Form } from 'antd';
import { useEffect } from "react";
import { useRequest } from "@umijs/max";


const AddOrEdit: React.FC<any> = ({setDrawerVisible, id, actionRef}) => {
    const [form] = Form.useForm();

    const {loading, run: queryRun} = useRequest(`/user/${id}`,
        {
            manual: true,
            onSuccess: (res) => {
                form.setFieldsValue(res)
            }
        });

    const {loading: saveLoading, run: saveRun} = useRequest(
        (data) => {
            if (id) {
                return {
                    method: 'PATCH',
                    url: `/user/${id}`,
                    data,
                }
            }
            return {
                method: 'POST',
                url: `/user`,
                data,
            }
        },
        {
            manual: true,
            onSuccess: () => {
                setDrawerVisible(false);
                actionRef?.current?.reloadAndRest?.();
            }
        });

    useEffect(() => {
        if (id) {
            queryRun()
        }
    }, [])

    return (
        <DrawerForm
            loading={loading || saveLoading}
            onOpenChange={setDrawerVisible}
            open={true}
            title={id ? '编辑用户' : '新建用户'}
            form={form}
            autoFocusFirstInput
            drawerProps={{
                destroyOnClose: true,
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
                saveRun(values)
            }}
        >
            <ProFormText
                name="account"
                width="md"
                label="账号"
                placeholder="请输入账号"
                rules={[{required: true}]}
            />
            <ProFormText
                name="nickName"
                width="md"
                label="昵称"
                placeholder="请输入昵称"
                rules={[{required: true}]}
            />
            <ProFormText
                name="email"
                width="md"
                label="Email"
                placeholder="请输入email"
                rules={[{required: true}]}
            />
            <ProFormText
                name="phone"
                width="md"
                label="Phone"
                placeholder="请输入手机号"
            />
            <ProFormSwitch
                name="status"
                label="状态"
                fieldProps={{checkedChildren: '启用', unCheckedChildren: '禁用'}}
                rules={[{required: true}]}
            />
            <ProFormRadio.Group
                name="role"
                label="角色"
                options={[
                    {
                        label: '管理员',
                        value: 'admin',
                    },
                    {
                        label: '普通用户',
                        value: 'default',
                    }
                ]}
                rules={[{required: true}]}
            />
        </DrawerForm>
    );
};

export default AddOrEdit