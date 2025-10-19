import {
  ModalForm, ProFormText,
} from "@ant-design/pro-form";
import useProFormItem from "@/hooks/useProFormItem";
import useProForm from "@/hooks/useProForm";
import { API_TAG } from "@/services/api";
import request from "@/utils/request";

type TagFormProps = {
  isEdit?: boolean;
  selectedData?: any;
  hide?: () => void;
  tableRef: any;
  visible?: boolean;
  onVisibleChange?: (v: boolean) => void;
}

export default function TagForm(props: TagFormProps) {
  const formControls = useProForm({
    visible: props.visible,
    onVisibleChange: props.onVisibleChange,
    onInitialValues(values: any): object {
      return values
    },
  })
  const nameProps = useProFormItem({
    name: 'name',
    label: '标签名',
    width: 'sm',
    required: true,
  })

  async function onFinish(values: any) {
    const data = {
        id: props.isEdit ? props.selectedData?._id : undefined,
        ...values,
      }
      await request({
        url: API_TAG,
        method: props.isEdit ? 'PUT' : 'POST',
        msg: props.isEdit ? '修改成功' : '添加成功',
        data
      })
      props.hide?.();
      props.tableRef.reload()
  }

  return (
    <ModalForm formRef={formControls.formRef} visible={formControls.visible} onVisibleChange={formControls.onVisibleChange} onFinish={onFinish} width={400}>
      <ProFormText {...nameProps} />
    </ModalForm>
  )
}
