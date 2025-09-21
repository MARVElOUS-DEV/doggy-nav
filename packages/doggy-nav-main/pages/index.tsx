import { useState, useEffect } from 'react'
import { Spin } from '@arco-design/web-react'
import Affiche from '@/components/Affiche'
import NavRankingList from '@/components/NavRankingList'
import AppNavList from '@/components/AppNavList'
import api from '@/utils/api'
import { useAtom } from 'jotai'
import { navRankingAtom, navDataAtom } from '@/store/store'

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [data, setData] = useAtom(navDataAtom);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [categories, navRankingData] = await Promise.all([
          api.getCategoryList(),
          api.getNavRanking(),
        ])

        const id = categories.length ? categories[0]._id : ''
        const navData = await api.findNavByCategory(id)

        setNavRanking(navRankingData)
        setData(navData)
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setNavRanking, setData])

  const handleSubMenuClick = async (id: string) => {
    setLoading(true);
    try {
      const navData = await api.findNavByCategory(id);
      setData(navData);
    } catch (error) {
      console.error('Failed to fetch nav data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main p-4">
      {loading && <Spin />}
      <Affiche />
      <NavRankingList data={navRanking} />
      <div className="website-wrapper">
        {data.map((item) => (
          <div key={item.name}>
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
