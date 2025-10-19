import React, { useEffect } from 'react';
import { Modal, Form, message } from 'antd';
import { ProForm, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import { useRequest } from '@umijs/max';

interface RoleModalProps {
  id?: string;
  open: boolean;
  onOk: () => void;
  onClose: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ id, open, onOk, onClose }) => {
  const [form] = Form.useForm();

  const { loading: detailLoading, run: getDetail } = useRequest(
    (rid: string) => ({ method: 'GET', url: `/api/roles`, params: { id: rid } }),
    {
      manual: true,
      onSuccess: (data) => {
        const role = Array.isArray(data?.data) ? data?.data?.find((r: any) => r?._id === id) : data?.data;
        if (role) form.setFieldsValue(role);
      },
    }
  );

  const { loading: submitLoading, run: submit } = useRequest(
    (data: any) => ({ method: id ? 'PUT' : 'POST', url: '/api/roles', data: { ...(id ? { id } : {}), ...data } }),
    {
      manual: true,
      onSuccess: () => { message.success(id ? '更新成功' : '创建成功'); onOk(); },
      onError: () => { message.error(id ? '更新失败' : '创建失败'); },
    }
  );

  useEffect(() => { if (open && id) getDetail(id); if (open && !id) form.resetFields(); }, [open, id]);

  return (
    <Modal title={id ? '编辑角色' : '新建角色'} open={open} onCancel={onClose} footer={null} width={600} destroyOnClose>
      <ProForm
        form={form}
        onFinish={async (values) => submit(values)}
        loading={submitLoading || detailLoading}
        submitter={{
          searchConfig: { submitText: '确定', resetText: '取消' },
          onReset: onClose,
        }}
      >
        <ProFormText name="slug" label="标识" placeholder="如 admin" rules={[{ required: true }, { pattern: /^[a-z0-9_-]+$/i, message: '仅字母数字_-'}]} />
        <ProFormText name="displayName" label="显示名称" placeholder="如 管理员" rules={[{ required: true }]} />
        <ProFormTextArea name="permissions" label="权限（逗号分隔）" placeholder="如 nav:list,category:create" fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }} />
      </ProForm>
    </Modal>
  );
};

export default RoleModal;
