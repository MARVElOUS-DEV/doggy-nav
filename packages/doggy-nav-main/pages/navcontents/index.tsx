import { useEffect } from 'react'
import { Spin } from '@arco-design/web-react'
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
  }, [category])

  return (
    <div className="main p-4 rounded-xl">
      {loading && <Spin />}
      <div className="website-wrapper">
        {(data??[]).map((item) => (
          <div key={item.name} className="mb-8 backdrop-filter backdrop-blur-sm rounded-xl p-4 bg-white bg-opacity-10">
            <div className="website-title" id={item._id}>
              {item.name}
            </div>
            <AppNavList list={item.list || []} />
          </div>
        ))}
      </div>
    </div>
  )
}