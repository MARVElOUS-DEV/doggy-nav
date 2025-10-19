import {
  DrawerForm,
  ProFormText,
  ProFormSwitch,
  ProFormSelect
} from '@ant-design/pro-form';
import { Form } from 'antd';
import { useEffect, useState } from "react";
import { useRequest } from "@umijs/max";


const AddOrEdit: React.FC<any> = ({setDrawerVisible, id, actionRef}) => {
    const [form] = Form.useForm();
    const isEdit = !!id;
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

    const {loading, run: queryRun} = useRequest(`/api/user/${id}`,
        {
            manual: true,
            onSuccess: (res) => {
                const data = (res && (res as any).data) ? (res as any).data : res;
                if (!data) return;
                const roles: string[] = Array.isArray((data as any).roles) ? (data as any).roles.filter((v: any) => typeof v === 'string') : [];
                form.setFieldsValue({
                    account: data.account,
                    nickName: data.nickName,
                    email: data.email,
                    phone: data.phone,
                    status: data.status,
                    roles,
                });
            }
        });

    const {loading: rolesLoading, run: getRoles} = useRequest(
        '/api/roles',
        {
            manual: true,
            onSuccess: (res) => {
                // Normalize API response shape; use role _id as value for precise assignment
                const raw = (res?.data?.data || res?.data || res || []) as any[];
                const options = (raw || []).map((role: any) => ({
                    label: role.displayName || role.slug,
                    value: role._id || role.id || role.slug,
                }));
                setRoleOptions(options);
            }
        }
    );

    const {loading: saveLoading, run: saveRun} = useRequest(
        (data) => {
            if (id) {
                return {
                    method: 'PATCH',
                    url: `/api/user/${id}`,
                    data,
                }
            }
            return {
                method: 'POST',
                url: `/api/user`,
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
        // Load roles regardless of edit/create mode
        getRoles();
        
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
                destroyOnHidden: true,
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
                // Send actual role ids via `roles` array; server supports this
                const selected: string[] = Array.isArray(values.roles) ? values.roles : [];
                const payload: any = { ...values, roles: selected };
                delete payload.role;
                saveRun(payload)
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
                rules={[
                  { required: true, message: '请输入email' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
            />
            <ProFormText.Password
                name="password"
                width="md"
                label="密码"
                placeholder={isEdit ? '留空则不修改密码' : '请输入密码'}
                rules={[
                  { required: !isEdit, message: '请输入密码' },
                  {
                    validator: async (_: any, value: string) => {
                      if (!value) return Promise.resolve();
                      const ok = value.length >= 6 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
                      return ok ? Promise.resolve() : Promise.reject(new Error('密码至少6位且包含大小写字母和数字'));
                    }
                  }
                ]}
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
            <ProFormSelect
                name="roles"
                width="md"
                label="角色"
                placeholder="请选择角色"
                options={roleOptions}
                fieldProps={{
                    mode: 'multiple',
                    loading: rolesLoading,
                }}
                rules={[{required: true, message: '请选择至少一个角色'}]}
            />
        </DrawerForm>
    );
};

export default AddOrEdit