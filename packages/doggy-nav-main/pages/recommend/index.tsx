'use client'
import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Message,
  Spin,
} from '@arco-design/web-react'
import axios from '@/utils/axios'
import { API_NAV, API_NAV_REPTILE } from '@/utils/api'
import { useAtom } from 'jotai'
import { RecommendFormValues } from '@/types'
import { categoriesAtom, tagsAtom } from '@/store/store'

const FormItem = Form.Item

export default function Recommend() {
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [categories] = useAtom(categoriesAtom)
  const [tags] = useAtom(tagsAtom)
  const [form] = Form.useForm()

  const addNav = async (values: RecommendFormValues) => {
    setLoading(true)
    const res = await axios.post(API_NAV, values)
    if (res.data.code === 0) {
      Message.error(`${res.data.msg}`)
    } else {
      Message.success('感谢您的支持，请等待后台审核通过！')
      form.resetFields()
    }
    setLoading(false)
  }

  const getNavInfo = async () => {
    const url = form.getFieldValue('href')
    if (!url) return
    setFormLoading(true)
    try {
      const { data } = await axios.get(`${API_NAV_REPTILE}?url=${url}`)
      form.setFieldsValue({
        logo: `https://www.google.com/s2/favicons?domain=${url}`,
        name: data?.name,
        desc: data?.desc,
      })
    } catch (e) {
      Message.error('请求超时')
    }
    setFormLoading(false)
  }

  const rules = {
    href: [
      { required: true, message: '请输入url' },
      {
        pattern:
          /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?/,
        message: '请输入正确的url',
      },
    ],
    tags: [{ required: true, message: '请输入标签' }],
    name: [{ required: true, message: '请输入名称' }],
    desc: [{ required: true, message: '请输入描述' }],
    logo: [{ required: true, message: '请输入logo' }],
    authorUrl: [
      {
        pattern:
          /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?/,
        message: '请输入正确的url',
      },
    ],
    authorName: [
      {
        pattern: /^[\u4e00-\u9fa5]{2,6}$/,
        message: '作者名称在2个字到6个字以内',
      },
    ],
  }

  return (
    <div className="container p-4">
      <Card>
        <Form form={form} layout="vertical" onSubmit={addNav}>
          {formLoading && <Spin />}
          <FormItem label="网站链接" field="href" rules={rules.href}>
            <Input placeholder="http://www.baidu.com/" onBlur={getNavInfo} />
          </FormItem>
          <FormItem label="网站标签" field="tags" rules={rules.tags}>
            <Select mode="multiple" showSearch allowCreate placeholder="输入网站标签，最多5个">
              {tags.map((item) => (
                <Select.Option key={item.name} value={item.name}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="网站名称" field="name" rules={rules.name}>
            <Input placeholder="输入网站名称" />
          </FormItem>
          <FormItem label="网站logo" field="logo" rules={rules.logo}>
            <Input placeholder="输入网站logo" />
          </FormItem>
          <FormItem label="网站描述" field="desc" rules={rules.desc}>
            <Input placeholder="一句话网站描述，15个字以内" />
          </FormItem>
          <FormItem label="网站分类" field="categoryId">
            <Select placeholder="请选择" showSearch>
              {categories.map((group) => (
                <Select.OptGroup key={group._id} label={group.name}>
                  {group.children?.map((item) => (
                    <Select.Option key={item._id} value={item._id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </FormItem>
          <FormItem label="推荐人名称" field="authorName" rules={rules.authorName}>
            <Input placeholder="填写你推广的名称" />
          </FormItem>
          <FormItem label="推荐人网站" field="authorUrl" rules={rules.authorUrl}>
            <Input placeholder="填写你要推广的链接" />
          </FormItem>
          <FormItem label="网站详情" field="detail">
            <Input.TextArea placeholder="输入网站详情" />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  )
}

