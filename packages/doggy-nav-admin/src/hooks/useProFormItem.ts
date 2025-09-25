import { ProFormFieldProps } from "@ant-design/pro-form";

export default function useProFormItem<T>(props: ProFormFieldProps & T): ProFormFieldProps & T {
  if (props.required) {
    props.rules = [{required: true}]
  }
  return {
    ...props
  }
}
