import { useEffect } from 'react'
import { Spin, Empty } from '@arco-design/web-react'
import AppNavList from '@/components/AppNavList'
import api from '@/utils/api'
import { useApi } from '@/hooks/useApi'
import { useRouter } from 'next/router'

export default function NavContentsPage() {
  const router = useRouter();
  const { category } = router.query;
  const {loading, data, execute:findNavByCategoryAction} = useApi(api.findNavByCategory)

  useEffect(() => {
    if (!category) return;
    findNavByCategoryAction(category as string)

  }, [category,findNavByCategoryAction])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Spin size={40} />
              <p className="mt-4 text-gray-600">正在加载精彩内容...</p>
            </div>
          </div>
        )}

        {/* Content Section */}
        {!loading && (
          <div className="website-wrapper space-y-12">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <div
                  key={item.id}
                  className={`category-section bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    index === 0 ? 'ring-2 ring-blue-100' : ''
                  }`}
                >
                  <div className="section-header bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                        <h2
                          id={item.id}
                          className="text-2xl font-bold text-gray-800"
                        >
                          {item.name}
                        </h2>
                        {item.list && (
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {item.list.length} 项
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">共 {item.list?.length || 0} 个网站</span>
                      </div>
                    </div>
                  </div>

                  <div className="section-content p-8">
                    {item.list && item.list.length > 0 ? (
                      <AppNavList list={item.list} />
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          description={
                            <div className="text-gray-500">
                              <p className="text-lg mb-2">暂无内容</p>
                              <p className="text-sm">此分类下暂时没有网站资源</p>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                <Empty
                  description={
                    <div className="text-gray-500">
                      <p className="text-2xl mb-4">📭</p>
                      <p className="text-lg mb-2">暂无导航内容</p>
                      <p className="text-sm">该分类下暂时没有任何网站资源</p>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && data && data.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">
                已为您展示 <span className="font-bold text-blue-600">{data.reduce((acc, item) => acc + (item.list?.length || 0), 0)}</span> 个网站资源
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}