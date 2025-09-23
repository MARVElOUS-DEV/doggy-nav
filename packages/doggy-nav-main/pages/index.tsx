import { useState, useEffect } from 'react'
import { Spin } from '@arco-design/web-react'
import Affiche from '@/components/Affiche'
import NavRankingList from '@/components/NavRankingList'
import api from '@/utils/api'
import { useAtom } from 'jotai'
import { navRankingAtom } from '@/store/store'

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [loading, setLoading] = useState(false);

  // Initial nav ranking fetch - only run once on component mount
  useEffect(() => {
    const fetchNavRanking = async () => {
      setLoading(true)
      try {
        const navRankingData = await api.getNavRanking();
        setNavRanking(navRankingData);
      } catch (error) {
        console.error("Failed to fetch nav ranking data", error);
      } finally{
        setLoading(false)
      }
    };
    fetchNavRanking();
  }, [setNavRanking]);

  return (
    <div className="main p-4 rounded-xl">
      {loading && <Spin />}
      <Affiche />
      <NavRankingList data={navRanking} />
    </div>
  )
}
