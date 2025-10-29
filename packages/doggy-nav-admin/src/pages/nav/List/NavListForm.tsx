import useProForm from '@/hooks/useProForm';
import useProFormItem from '@/hooks/useProFormItem';
import CategorySelect from '@/pages/nav/Category/CategorySelect';
import TagSelect from '@/pages/nav/Tag/TagSelect';
import { API_NAV, getGroups, getRoles } from '@/services/api';
import request from '@/utils/request';
import {
  DrawerForm,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-form';
import { Form } from 'antd';
import { useEffect, useState } from 'react';

type NavListFormProps = {
  isEdit?: boolean;
  selectedData?: any;
  hide?: () => void;
  tableRef?: any;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
};

export default function NavListForm(props: NavListFormProps) {
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [groupOptions, setGroupOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, groupsRes] = await Promise.all([
          getRoles(),
          getGroups(),
        ]);
        const roles = rolesRes?.data?.data || rolesRes?.data || [];
        const groups = groupsRes?.data?.data || groupsRes?.data || [];
        setRoleOptions(
          (roles || []).map((r: any) => ({
            label: r.displayName || r.slug,
            value: r.id,
          })),
        );
        setGroupOptions(
          (groups || []).map((g: any) => ({
            label: g.displayName || g.slug,
            value: g.id,
          })),
        );
      } catch {}
    })();
  }, []);

  const formControls = useProForm({
    visible: props.visible,
    onVisibleChange: props.onVisibleChange,
    isEdit: props.isEdit,
    selectedData: props.selectedData,
  });
  const onFinish = async (values) => {
    const audience = values?.audience || {};
    if (audience.visibility !== 'restricted') {
      delete audience.allowRoles;
      delete audience.allowGroups;
    }
    const data = {
      id: props.isEdit ? props.selectedData?.id : undefined,
      ...values,
      audience,
    };
    await request({
      url: API_NAV,
      method: props.isEdit ? 'PUT' : 'POST',
      msg: props.isEdit ? '编辑成功' : '添加成功',
      data,
    });
    props.hide?.();
    props.tableRef?.reload?.();
    return true;
  };
  const logoProps = useProFormItem({
    name: 'logo',
    label: '网站LOGO',
    required: true,
  });
  const nameProps = useProFormItem({
    name: 'name',
    label: '网站名称',
    required: true,
  });

  const descProps = useProFormItem({
    name: 'desc',
    label: '网站描述',
    required: true,
  });
  const urlProps = useProFormItem({
    name: 'href',
    label: '网站链接',
    required: true,
  });
  const authorProps = useProFormItem({
    name: 'authorName',
    label: '作者名称',
  });
  const authorUrlProps = useProFormItem({
    name: 'authorUrl',
    label: '作者网站',
  });

  return (
    <DrawerForm
      formRef={formControls.formRef}
      open={formControls.visible}
      onOpenChange={formControls.onVisibleChange}
      drawerProps={{ width: 600 }}
      onFinish={onFinish}
    >
      <ProFormDependency name={['logo']}>
        {({ logo }) => (
          <ProFormText
            {...logoProps}
            formItemProps={{ extra: <img width={50} src={logo} /> }}
          />
        )}
      </ProFormDependency>

      <ProFormText {...nameProps} />
      <Form.Item name="categoryId" label="网站分类">
        <CategorySelect />
      </Form.Item>
      <Form.Item name="tags" label="网站标签">
        <TagSelect valueKey={'name'} />
      </Form.Item>
      <ProFormTextArea {...descProps} />
      <ProFormText {...urlProps} />
      <ProFormText {...authorProps} />
      <ProFormText {...authorUrlProps} />
      <ProFormSelect
        name={['audience', 'visibility']}
        label="可见性"
        valueEnum={{
          public: '公开',
          authenticated: '登录可见',
          restricted: '受限（指定角色/用户组）',
          hide: '隐藏（任何端不展示）',
        }}
        initialValue={'public'}
      />
      <ProFormDependency name={['audience']}>
        {({ audience }) =>
          audience?.visibility === 'restricted' ? (
            <>
              <ProFormSelect
                name={['audience', 'allowRoles']}
                label="允许角色"
                mode="multiple"
                options={roleOptions}
              />
              <ProFormSelect
                name={['audience', 'allowGroups']}
                label="允许用户组"
                mode="multiple"
                options={groupOptions}
              />
            </>
          ) : null
        }
      </ProFormDependency>
    </DrawerForm>
  );
}
