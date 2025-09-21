import { useState, useEffect } from 'react'
import { Spin } from '@arco-design/web-react'
import Affiche from '@/components/Affiche'
import NavRankingList from '@/components/NavRankingList'
import AppNavList from '@/components/AppNavList'
import api from '@/utils/api'
import { useAtom } from 'jotai'
import { navRankingAtom, navDataAtom, selectedCategoryAtom } from '@/store/store'

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [data, setData] = useAtom(navDataAtom);
  const [selectedCategory] = useAtom(selectedCategoryAtom);
  const [loading, setLoading] = useState(false);

  // Initial nav ranking fetch - only run once on component mount
  useEffect(() => {
    const fetchNavRanking = async () => {
      try {
        const navRankingData = await api.getNavRanking();
        setNavRanking(navRankingData);
      } catch (error) {
        console.error("Failed to fetch nav ranking data", error);
      }
    };
    fetchNavRanking();
  }, [setNavRanking]);

  // Separate effect to handle category changes after initial load
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchNavData = async () => {
      setLoading(true);
      try {
        const navData = await api.findNavByCategory(selectedCategory);
        setData(navData);
      } catch (error) {
        console.error('Failed to fetch nav data for category:', selectedCategory, error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavData();
  }, [selectedCategory, setData])

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
