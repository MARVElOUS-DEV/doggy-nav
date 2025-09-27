import { useEffect, useRef } from 'react';
import type { ProFormProps } from '@ant-design/pro-form';

interface IProps extends ProFormProps {
  onInitialValues(values: any): object,
  [name: string]: any
}

export default function useProForm(props: IProps): IProps & { formRef: any } {
  const form = useRef<any>({});

  useEffect(() => {
    if (props?.visible && props.selectedData) {
      if (props.isEdit) {
        // 设置编辑表单的选中值
        let selectedData = props.selectedData
        if (props.onInitialValues) {
          selectedData = props.onInitialValues(props.selectedData)
        }
        form.current.setFieldsValue(selectedData)
      } else {
        form.current.resetFields()
      }

    }
  }, [props?.visible]);


  return {
    formRef: form,
    ...props
  }
}
