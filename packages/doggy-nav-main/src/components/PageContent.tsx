'use client'
import { useState, useEffect } from 'react'
import { Layout, Spin } from '@arco-design/web-react'
import AppNavMenus from '@/components/AppNavMenus'
import AppHeader from '@/components/AppHeader'
import Affiche from '@/components/Affiche'
import NavRankingList from '@/components/NavRankingList'
import AppNavList from '@/components/AppNavList'
import Toolbar from '@/components/Toolbar'
import AppLog from '@/components/AppLog'
import api from '@/utils/api'
import axios from '@/utils/axios'
import { API_NAV_RANKING } from '@/utils/api'
import { useAtom } from 'jotai';
import { categoriesAtom, navRankingAtom, navDataAtom, showMenuTypeAtom, contentMarginLeftAtom, showLogAtom } from '@/store/store';

export default function PageContent() {
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [data, setData] = useAtom(navDataAtom);
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [contentMarginLeft, setContentMarginLeft] = useAtom(contentMarginLeftAtom);
  const [showLog, setShowLog] = useAtom(showLogAtom);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [categoriesResponse, navRankingResponse] = await Promise.all([
          api.getCategoryList(),
          axios.get(API_NAV_RANKING),
        ])
        const categories = categoriesResponse.data.data;
        const navRankingData = navRankingResponse.data.data;

        const id = categories.length ? categories[0]._id : ''
        const navDataResponse = await api.findNav(id)
        const navData = navDataResponse.data.data

        setCategories(categories)
        setNavRanking(navRankingData)
        setData(navData)
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setCategories, setData, setNavRanking])

  useEffect(() => {
    setContentMarginLeft(showMenuType ? '220px' : '70px');
  }, [showMenuType, setContentMarginLeft]);

  const handleSubMenuClick = async (id: string) => {
    setLoading(true);
    try {
      const navDataResponse = await api.findNav(id);
      if (navDataResponse.data.data) {
        setData(navDataResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch nav data', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    setShowMenuType((prev) => !prev);
  };
  const toggleMenu2 = toggleMenu;

  return (
    <Layout className="user-layout">
      <AppNavMenus
        onHandleSubMenuClick={handleSubMenuClick}
        categories={categories}
        showMenuType={showMenuType ? 'all' : 'half'}
        onShowMenus={toggleMenu2}
      />
      <Layout className="body" style={{ marginLeft: contentMarginLeft }}>
        <AppHeader
          onHandleShowPopup={() => {}}
          onHandleShowMenu={toggleMenu}
        />
        <div className="main" style={{ position: 'relative' }}>
          {loading && <Spin />}
          <Affiche />
          <NavRankingList data={navRanking} />
          <div className="website-wrapper">
            {data.map((item) => (
              <div key={item.name}>
                <p className="website-title" id={item._id}>
                  {item.name}
                </p>
                <AppNavList list={item.list || []} />
              </div>
            ))}
          </div>
        </div>
      </Layout>
      <Toolbar onShowLog={() => setShowLog(true)} />
      <AppLog show={showLog} onCloseLog={() => setShowLog(false)} />
    </Layout>
  )
}
