import { API_CATEGORY_LIST } from '@/services/api';
import { CategoryModel } from '@/types/api';
import { buildCategoryOptions } from '@/utils/helpers';
import request from '@/utils/request';
import type { SelectProps } from 'antd';
import { Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';

interface CategorySelectProps extends Omit<
  SelectProps<string>,
  'onChange' | 'options' | 'value'
> {
  onChange?: (value: string) => void;
  value?: string;
}

export default function CategorySelect(props: CategorySelectProps) {
  const { onChange, value, ...selectProps } = props;
  const [categoryList, setCategoryList] = useState<CategoryModel[]>([]);
  const [internalValue, setInternalValue] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function getCategoryList() {
      const res = await request({
        url: API_CATEGORY_LIST,
        method: 'GET',
      });
      if (isMounted) {
        setCategoryList(res.data);
      }
    }

    getCategoryList();

    return () => {
      isMounted = false;
    };
  }, []);

  function onSelectChange(value: string) {
    setInternalValue(value);
    if (onChange) {
      onChange(value);
    }
  }

  const currentValue = value !== undefined ? value : internalValue;

  const options = useMemo<SelectProps['options']>(() => {
    return buildCategoryOptions(categoryList || []);
  }, [categoryList]);

  return (
    <Select<string>
      {...selectProps}
      onChange={onSelectChange}
      value={currentValue}
      showSearch
      optionFilterProp="label"
      options={options}
    />
  );
}
