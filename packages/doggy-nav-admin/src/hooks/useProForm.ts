import { useEffect, useRef } from 'react';
import type { ProFormProps } from '@ant-design/pro-form';

interface IProps extends ProFormProps {
  onInitialValues?(values: any): object,
  [name: string]: any
}

export default function useProForm(props: IProps): Pick<IProps, 'visible' | 'onVisibleChange'> & { formRef: any } {
  const form = useRef<any>({});

  useEffect(() => {
    if (props?.visible && props.selectedData) {
      if (props.isEdit) {
        // 设置编辑表单的选中值
        let selectedData = props.selectedData
        if (props.onInitialValues) {
          selectedData = props.onInitialValues(props.selectedData)
        }
        try { form.current?.setFieldsValue?.(selectedData) } catch {}
      } else {
        try { form.current?.resetFields?.() } catch {}
      }

    }
  }, [props?.visible]);


  return {
    formRef: form,
    visible: props.visible,
    onVisibleChange: props.onVisibleChange,
  }
}
