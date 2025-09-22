import { ProFormFieldItemProps } from "@ant-design/pro-form/es/interface";

export default function useProFormItem<T>(props: ProFormFieldItemProps & T): ProFormFieldItemProps & T {
  if (props.required) {
    props.rules = [{required: true}]
  }
  return {
    ...props
  }
}
