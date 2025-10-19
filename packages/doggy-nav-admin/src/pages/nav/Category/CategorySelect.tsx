import { Select } from "antd";
import type { SelectProps } from 'antd';
import request from "@/utils/request";
import { API_CATEGORY_LIST } from "@/services/api";
import { useEffect, useMemo, useState } from "react";
import { CategoryModel } from "@/types/api";

interface CategorySelectProps {
  onChange?: (value: string) => void;
  value?: string;
  [key: string]: any;
}

export default function CategorySelect(props: CategorySelectProps) {
  const { onChange, value } = props;
  const [categoryList, setCategoryList] = useState<CategoryModel[]>([]);
  const [internalValue, setInternalValue] = useState<string>('');

  useEffect(()=> {
    let isMounted = true;

    async function getCategoryList() {
      const res = await request({
        url: API_CATEGORY_LIST,
        method: 'GET'
      })
      if (isMounted) {
        setCategoryList(res.data)
      }
    }

    getCategoryList()

    return () => {
      isMounted = false;
    };
  }, [])

  function onSelectChange(value: string) {
    setInternalValue(value);
    if (onChange) {
      onChange(value);
    }
  }

  const currentValue = value !== undefined ? value : internalValue;

  const options = useMemo<SelectProps['options']>(() => {
    return (categoryList || []).map((item) => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (!hasChildren) {
        return { label: item.name, value: item._id };
      }
      return {
        label: item.name,
        options: [
          { label: item.name, value: item._id },
          ...item.children.map((sub) => ({ label: sub.name, value: sub._id })),
        ],
      } as any;
    });
  }, [categoryList]);

  return (
    <Select<string>
      onChange={onSelectChange}
      value={currentValue}
      showSearch
      optionFilterProp="label"
      options={options}
    />
  )
}
