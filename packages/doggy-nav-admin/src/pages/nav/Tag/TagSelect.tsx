import { Select, SelectProps } from "antd";
import request from "@/utils/request";
import { API_TAG_list } from "@/services/api";
import { useEffect, useState } from "react";
import { TagModel } from "@/types/api";

interface TagSelectProps extends SelectProps<any> {
  valueKey?: string;
  [key: string]: any;
}

export default function TagSelect(props: TagSelectProps) {
  const { onChange, value, valueKey = '_id', ...restProps } = props;
  const [tagList, setTagList] = useState<TagModel[]>([]);
  const [internalValue, setInternalValue] = useState<any[]>([]);

  useEffect(()=> {
    let isMounted = true;

    async function getTagList() {
      const { data } = await request({
        url: API_TAG_list,
        method: 'GET'
      })
      if (isMounted && Array.isArray(data.data)) {
        setTagList(data?.data)
      }
    }

    getTagList()

    return () => {
      isMounted = false;
    };
  }, [])

  function onSelectChange(value: any) {
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
      mode={'tags'}
      {...restProps}
    >
        {tagList.map(subItem => <Select.Option value={subItem[valueKey]} key={subItem._id}>{subItem.name}</Select.Option>)}
    </Select>
  )
}
