import { Select } from "antd";
import request from "@/utils/request";
import { API_CATEGORY_LIST } from "@/services/api";
import { useEffect, useState } from "react";
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

  return (
    <Select
      onChange={onSelectChange}
      value={currentValue}
      showSearch
    >
      {categoryList.map(item => <Select.OptGroup label={item.name} key={item._id}>
        {item.children.map(subItem => <Select.Option value={subItem._id} key={subItem._id}>{subItem.name}</Select.Option>)}
      </Select.OptGroup>)}
    </Select>
  )
}
