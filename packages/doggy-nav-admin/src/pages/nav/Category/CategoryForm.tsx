import {
  ModalForm, ProFormDependency, ProFormSelect, ProFormSwitch, ProFormText
} from "@ant-design/pro-form";
import { Form } from "antd";
import useProFormItem from "@/hooks/useProFormItem";
import useProForm from "@/hooks/useProForm";
import { API_CATEGORY } from "@/services/api";
import request from "@/utils/request";
import IconPicker from "@/components/IconPicker";
import "./style.less";

export default function CategoryForm(props: any) {
  const formProps = useProForm({
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

  const icons = [
    'iconfont icon-qianduan',
    'iconfont icon-bd_jiaocheng',
    'iconfont icon-ziyuan',
    'iconfont icon-chanpin',
    'iconfont icon-gongju',
    'iconfont icon-yunying',
    'iconfont icon-sheji',
  ]

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
      props.hide();
      props.tableRef.reload()
  }

  return (
    <ModalForm {...props} {...formProps} onFinish={onFinish} width={500}>
      <ProFormText {...nameProps} />
      <ProFormSelect {...categoryProps} options={props.categoryList.reduce((t, v) => [...t, {label: v.name, value: v._id}], [])}/>
      <Form.Item name="icon" label={categoryIconProps.label} rules={[{ required: categoryIconProps.required }]}>
        <IconPicker placeholder="选择分类图标" />
      </Form.Item>
      <ProFormSwitch {...showMenuProps} />
    </ModalForm>
  )
}
