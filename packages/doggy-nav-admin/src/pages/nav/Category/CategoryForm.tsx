import {
  ModalForm, ProFormSelect, ProFormSwitch, ProFormText, ProFormItem
} from "@ant-design/pro-form";
import useProFormItem from "@/hooks/useProFormItem";
import useProForm from "@/hooks/useProForm";
import { API_CATEGORY } from "@/services/api";
import request from "@/utils/request";
import IconPicker from "@/components/IconPicker";
import "./style.less";

export default function CategoryForm(props: {categoryList: any[], isEdit?: boolean, selectedData?: any, hide?: () => void, tableRef: any} ) {
  const {...formProps} = useProForm({
    ...props,
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
    <ModalForm {...formProps} onFinish={onFinish} width={500}>
      <ProFormText {...nameProps} />
      <ProFormSelect {...categoryProps} mode="single" disabled={props.selectedData.categoryId===''} options={props.categoryList.reduce((t, v) => [...t, {label: v.name, value: v._id}], [])}/>
      <ProFormItem name="icon" label={categoryIconProps.label}
        rules={[{ required: categoryIconProps.required }]}
      >
        <IconPicker placeholder="选择分类图标" />
      </ProFormItem>
      <ProFormSwitch {...showMenuProps} />
    </ModalForm>
  )
}
