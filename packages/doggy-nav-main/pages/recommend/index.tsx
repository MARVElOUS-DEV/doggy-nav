'use client'
import { useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Message,
  Spin,
} from '@arco-design/web-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from '@/utils/axios'
import { API_NAV_ADD, API_NAV_REPTILE } from '@/utils/api'
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
    try {
      await axios.post(API_NAV_ADD, values)
      Message.success('感谢您的支持，请等待后台审核通过！')
      form.resetFields()
    } catch (error) {
      Message.error(`${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getNavInfo = async () => {
    const url = form.getFieldValue('href')
    if (!url) return
    setFormLoading(true)
    try {
      const {logo, name, desc} = await axios.get<{logo?:string,name:string,desc:string}>(`${API_NAV_REPTILE}?url=${url}`)as any;
      form.setFieldsValue({
        logo: logo??`https://www.google.com/s2/favicons?domain=${url}`,
        name,
        desc
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
    tags: [{ max: 5, message: '最多选择5个标签' }],
    categoryId: [{ required: true, message: '请选择网站的类别' }],
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            推荐网站
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">分享优质网站，共建更好的互联网生态</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl backdrop-blur-lg bg-opacity-95 dark:bg-opacity-90 p-8 border border-white/20 dark:border-gray-700/50"
        >
          <Form form={form} layout="vertical" onSubmit={addNav}>
            <AnimatePresence>
              {formLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-2xl flex items-center justify-center z-10"
                >
                  <Spin size={20} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-2"
              >
                <FormItem label="🔗 网站链接" field="href" rules={rules.href}>
                  <Input
                    placeholder="http://www.baidu.com/"
                    onBlur={getNavInfo}
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FormItem label="📝 网站名称" field="name" rules={rules.name}>
                  <Input
                    placeholder="输入网站名称"
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <FormItem label="🖼️ 网站logo" field="logo" rules={rules.logo}>
                  <Input
                    placeholder="输入网站logo"
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-pink-400 dark:focus:border-pink-500 focus:ring-pink-200 dark:focus:ring-pink-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="md:col-span-2"
              >
                <FormItem label="📄 网站描述" field="desc" rules={rules.desc}>
                  <Input
                    placeholder="一句话网站描述，15个字以内"
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <FormItem label="📂 网站分类" field="categoryId" rules={rules.categoryId}>
                  <Select
                    placeholder="请选择"
                    showSearch
                    className="recommend-sel-container h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-800 rounded-xl transition-all duration-300 category-select bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                      {renderCategories(categories)}
                    </Select>
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <FormItem label="🏷️ 网站标签" field="tags" rules={rules.tags} className="pt-[1em]">
                  <Select
                    mode="multiple"
                    showSearch
                    allowCreate
                    placeholder="输入网站标签，最多5个"
                    className="recommend-sel-container h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-green-400 dark:focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                      {tags.map((item) => (
                        <Select.Option key={item.name} value={item.name}>
                          {item.label}
                        </Select.Option>
                      ))}
                    </Select>
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <FormItem label="👤 推荐人名称" field="authorName" rules={rules.authorName}>
                  <Input
                    placeholder="填写你推广的名称"
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <FormItem label="🔗 推荐人网站" field="authorUrl" rules={rules.authorUrl}>
                  <Input
                    placeholder="填写你要推广的链接"
                    className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="md:col-span-2"
              >
                <FormItem label="📝 网站详情" field="detail">
                  <Input.TextArea
                    placeholder="输入网站详情"
                    className="h-24 border-2 border-gray-200 dark:border-gray-600 focus:border-green-400 dark:focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-800 rounded-xl transition-all duration-300 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </FormItem>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="mt-8 text-center"
            >
              <FormItem>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? '提交中...' : '提交推荐'}
                  </Button>
                </motion.div>
              </FormItem>
            </motion.div>
          </Form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm"
        >
          <p>感谢您的贡献，让我们一起打造更好的网络导航！</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

const renderCategories = (categories) => {
  const defaultLists: React.ReactNode[] = []
  const list = categories.map((group) => {
    if (!group.children || group.children.length === 0) {
      defaultLists.push((
      <Select.Option key={group.id} value={group.id}>
            {group.name}
        </Select.Option>))
      return  null
    }else {
      return (
        <Select.OptGroup key={group.id} label={group.name}>
          {group.children?.map((item) => (
            <Select.Option key={item.id} value={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select.OptGroup>
      )
    }
  }
).filter(Boolean);
  return [
  (<Select.OptGroup key='default-list-key' label={"default"}>
      {defaultLists}
  </Select.OptGroup>),
  ...list]
}
