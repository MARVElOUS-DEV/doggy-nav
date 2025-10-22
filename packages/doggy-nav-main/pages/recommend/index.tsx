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
import { useAtomValue } from 'jotai'
import { RecommendFormValues } from '@/types'
import { categoriesAtom, tagsAtom } from '@/store/store'
import { useTranslation } from 'react-i18next'

const FormItem = Form.Item

export default function Recommend() {
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const categories = useAtomValue(categoriesAtom)
  const tags = useAtomValue(tagsAtom)
  const [form] = Form.useForm()
  const { t } = useTranslation('translation')

  const addNav = async (values: RecommendFormValues) => {
    setLoading(true)
    try {
      await axios.post(API_NAV_ADD, values)
      Message.success(t('thank_you_support'))
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
      Message.error(t('request_timeout'))
    }
    setFormLoading(false)
  }

  const rules = {
    href: [
      { required: true, message: t('enter_url') },
      {
        pattern:
          /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?/,
        message: t('enter_correct_url'),
      },
    ],
    tags: [{ max: 5, message: t('max_5_tags') }],
    categoryId: [{ required: true, message: t('select_category') }],
    name: [{ required: true, message: t('enter_name') }],
    desc: [{ required: true, message: t('enter_description') }],
    logo: [{ required: true, message: t('enter_logo') }],
    authorUrl: [
      {
        pattern:
          /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?/,
        message: t('enter_correct_url'),
      },
    ],
    authorName: [
      {
        pattern: /^[\u4e00-\u9fa5]{2,6}$/,
        message: t('author_name_2_6_chars'),
      },
    ],
  }

  return (
    <div className="p-8">
      <div className="container mx-auto max-w-7xl text-theme-foreground bg-content-background border border-theme-border rounded-xl shadow-md transition-colors">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto py-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="my-0 text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {t('recommend_website')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">{t('share_quality_websites')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative p-8 border border-theme-border border-x-0 dark:border-gray-700/50 rounded-2xl"
          >
            <Form form={form} layout="vertical" onSubmit={addNav}>
              <AnimatePresence>
                {formLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-theme-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 ring-1 ring-theme-border"
                  >
                    <Spin size={24} />
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
                  <FormItem label={t('website_link')} field="href" rules={rules.href}>
                    <Input
                      placeholder={t('enter_website_url')}
                      onBlur={getNavInfo}
                      aria-busy={formLoading}
                      suffix={formLoading ? <Spin size={16} /> : null}
                      className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </FormItem>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FormItem label={t('website_name')} field="name" rules={rules.name}>
                    <Input
                      placeholder={t('enter_website_name')}
                      className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </FormItem>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <FormItem label={t('website_logo')} field="logo" rules={rules.logo}>
                    <Input
                      placeholder={t('enter_website_logo')}
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
                  <FormItem label={t('website_description')} field="desc" rules={rules.desc}>
                    <Input
                      placeholder={t('enter_website_description')}
                      className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </FormItem>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <FormItem label={t('website_category')} field="categoryId" rules={rules.categoryId}>
                    <Select
                      placeholder={t('select')}
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
                  <FormItem label={t('website_tags')} field="tags" rules={rules.tags} className="pt-[1em]">
                    <Select
                      mode="multiple"
                      showSearch
                      allowCreate
                      placeholder={t('enter_website_tags')}
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
                  <FormItem label={t('recommender_name')} field="authorName" rules={rules.authorName}>
                    <Input
                      placeholder={t('enter_recommender_name')}
                      className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </FormItem>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <FormItem label={t('recommender_website')} field="authorUrl" rules={rules.authorUrl}>
                    <Input
                      placeholder={t('enter_recommender_url')}
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
                  <FormItem label={t('website_details')} field="detail">
                    <Input.TextArea
                      placeholder={t('enter_website_details')}
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
                      {loading ? t('submitting') : t('submit_recommendation')}
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
            <p>{t('thank_you_contribution')}</p>
          </motion.div>
        </motion.div>
      </div>
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
