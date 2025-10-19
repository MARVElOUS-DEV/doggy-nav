import {
  ModalForm, ProFormSelect, ProFormSwitch, ProFormText, ProFormItem
} from "@ant-design/pro-form";
import useProFormItem from "@/hooks/useProFormItem";
import useProForm from "@/hooks/useProForm";
import { API_CATEGORY } from "@/services/api";
import request from "@/utils/request";
import IconPicker from "@/components/IconPicker";
import "./style.less";
import { useEffect, useState } from "react";
import { getGroups, getRoles } from "@/services/api";

type CategoryFormProps = {
  categoryList: any[];
  isEdit?: boolean;
  selectedData?: any;
  hide?: () => void;
  tableRef: any;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
}

export default function CategoryForm(props: CategoryFormProps) {
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, groupsRes] = await Promise.all([getRoles(), getGroups()]);
        const roles = rolesRes?.data?.data || rolesRes?.data || [];
        const groups = groupsRes?.data?.data || groupsRes?.data || [];
        setRoleOptions((roles || []).map((r: any) => ({ label: r.displayName || r.slug, value: r._id })));
        setGroupOptions((groups || []).map((g: any) => ({ label: g.displayName || g.slug, value: g._id })));
      } catch {}
    })();
  }, []);
  const { ...formControls } = useProForm({
    visible: props.visible,
    onVisibleChange: props.onVisibleChange,
    selectedData: props.selectedData,
    isEdit: props.isEdit,
    onInitialValues(values: any): object {
      return values
    },
  })
  const nameProps = useProFormItem({
    name: 'name',
    label: '分类名',
    width: 'sm',
    required: true,
  })
  const categoryProps = useProFormItem({
    name: 'categoryId',
    label: '父级分类',
    width: 'sm',
  })
  const categoryIconProps = useProFormItem({
    name: 'icon',
    label: '分类图标',
    width: 'sm',
  })
  const showMenuProps = useProFormItem({
    name: 'showInMenu',
    label: '显示到菜单',
    width: 'sm',
  })

  async function onFinish(values: any) {
    const data = {
        id: props.isEdit ? props.selectedData?._id : undefined,
        ...values,
      }
      await request({
        url: API_CATEGORY,
        method: props.isEdit ? 'PUT' : 'POST',
        msg: props.isEdit ? '修改成功' : '添加成功',
        data
      })
      props.hide?.();
      props.tableRef.reload()
  }

  return (
    <ModalForm formRef={formControls.formRef} visible={formControls.visible} onVisibleChange={formControls.onVisibleChange} onFinish={onFinish} width={500}>
      <ProFormText {...nameProps} />
      <ProFormSelect {...categoryProps} mode="single" disabled={props.selectedData?.categoryId===''} options={props.categoryList.reduce((t, v) => [...t, {label: v.name, value: v._id}], [])}/>
      <ProFormItem name="icon" label={categoryIconProps.label}
        rules={[{ required: categoryIconProps.required }]}
      >
        <IconPicker placeholder="选择分类图标" />
      </ProFormItem>
      <ProFormSwitch {...showMenuProps} />
      <ProFormSelect
        name={['audience','visibility']}
        label="可见性"
        valueEnum={{ public: '公开', authenticated: '登录可见', restricted: '受限（指定角色/用户组）' }}
        initialValue={'public'}
      />
      <ProFormSelect
        name={['audience','allowRoles']}
        label="允许角色"
        mode="multiple"
        options={roleOptions}
      />
      <ProFormSelect
        name={['audience','allowGroups']}
        label="允许用户组"
        mode="multiple"
        options={groupOptions}
      />
    </ModalForm>
  )
}
