'use client';
import { useState, useEffect } from 'react';
import { Grid, Tooltip, Spin } from '@arco-design/web-react';
import api from '@/utils/api';
import Link from 'next/link';
import Image from 'next/image';
import { NavItem } from '@/types';
import { useRouter } from 'next/router';

const { Row, Col } = Grid

export default function NavDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<NavItem>({
    _id: '',
    categoryId: "",
    name: "detail",
    href: "/",
    desc: "this is description",
    logo: "https://img.alicdn.com/imgextra/i1/O1CN014dDq4L1Zc3guRwcse_!!6000000003214-2-tps-1600-941.png",
    authorName: "doggy-nav",
    authorUrl: "/admin",
    auditTime: new Date().toLocaleString(),
    createTime: new Date().toLocaleString(),
    tags: ["private"],
    view: 1,
    star: 1,
    status: 1,
  })
  const [randomNavList, setRandomNavList] = useState<NavItem[]>([])
  const [isStar, setIsStar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [detail, randomNavList] = await Promise.all([
          api.findNavById(id as string),
          api.getRandomNav(),
        ])
        setDetail(detail || { tags: [] })
        setRandomNavList(randomNavList || [])
      } catch (error) {
        console.error('Failed to fetch data', error)
      } finally {
        setLoading(false)
      }
    }
    id && typeof id === 'string' && fetchData()
  }, [id])

  const handleNavStarFn = async () => {
    if (detail) {
      try {
        await api.updateNavStar(detail._id)
        setIsStar(true)
        setDetail({ ...detail, star: detail.star + 1 })
      } catch (error) {
        console.error('Star failed', error)
      }
    }
  }

  const handleNavClick = (detail: NavItem) => {
    window.open(detail.href, '_blank')
  }

  const getRandomNavList = async () => {
    setLoading(true)
    try {
      const randomNavList = await api.getRandomNav()
      setRandomNavList(randomNavList || [])
    } catch (error) {
      console.error('Failed to get random nav list', error)
    } finally {
      setLoading(false)
    }
  }

  if (!detail) {
    return <Spin />
  }

  return (
    <div className="container p-4 mx-auto max-w-7xl">
      {loading && <Spin />}
      <Row gutter={32} className="site-info mt-8">
        <Col md={8} xs={24} className="item">
          <div className="left bg-white rounded-xl shadow-lg p-6 relative border border-gray-100">
            <div className="img-wrap h-56 flex items-center justify-center bg-gray-50 rounded-lg">
              <Link href="/">
                <Image src={detail.logo} alt={detail.name} width={120} height={120} className="object-cover rounded-lg shadow-md" />
              </Link>
            </div>
            <div className="tool absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Tooltip content="访问数">
                <div className="tool-item flex flex-col items-center justify-center w-14 h-14 bg-blue-50 rounded-full shadow-md text-blue-600 hover:bg-blue-100 transition-colors">
                  <i className="iconfont icon-attentionfill text-lg"></i>
                  <p className="m-0 text-xs font-medium">{detail.view}</p>
                </div>
              </Tooltip>
              <Tooltip content="点赞数">
                <div
                  className={`tool-item flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-md cursor-pointer transition-colors ${
                    isStar ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={handleNavStarFn}
                >
                  <i className="iconfont icon-appreciatefill text-lg"></i>
                  <p className="m-0 text-xs font-medium">{detail.star}</p>
                </div>
              </Tooltip>
            </div>
          </div>
        </Col>
        <Col md={16} xs={24} className="item">
          <div className="content">
            <h1 className="title text-4xl font-bold text-gray-800 mb-4">{detail.name}</h1>
            <p className="desc text-lg text-gray-600 mb-6 leading-relaxed">{detail.desc}</p>
            {(detail?.tags?.length??0) > 0 && (
              <div className="tags mb-6">
                <span className="text-gray-700 font-medium mr-2">标签：</span>
                {detail?.tags?.map((tag: string, index: number) => (
                  <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mr-2 mb-2">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {detail.authorName && (
              <div className="author mb-6 flex items-center text-gray-700">
                <span className="mr-2">👤</span>
                <span className="mr-2">推荐人：</span>
                <a href={detail.authorUrl} className="text-blue-600 hover:text-blue-800 transition-colors font-medium">
                  {detail.authorName}
                </a>
              </div>
            )}
            <div className="btn-group flex mt-8">
              <div
                onClick={() => handleNavClick(detail)}
                className="btn-link btn-group-item bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                链接直达
                <i className="iconfont icon-Icons_ToolBar_ArrowRight ml-2 text-sm"></i>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={32} className="random-section mt-12">
        <Col span={24}>
          <div className="app-card bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="app-card-header flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="app-card-title m-0 text-xl font-bold text-gray-800">随机网址</h3>
              <div className="app-card-extra">
                <i
                  className="iconfont icon-shuaxin cursor-pointer text-gray-500 hover:text-blue-600 transition-colors text-lg"
                  onClick={getRandomNavList}
                ></i>
              </div>
            </div>
            <div className="app-card-content p-6">
              <Row gutter={[16, 16]}>
                {randomNavList.map((item) => (
                  <Col span={12} sm={8} md={6} key={item._id}>
                    <Link href={`/nav/${item._id}`} className="nav-block flex items-center p-3 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 rounded-lg">
                      <Image src={item.logo} alt="" className="nav-logo w-6 h-6 mr-3 rounded" width={24} height={24}/>
                      <h4 className="nav-name m-0 truncate text-sm font-medium">{item.name}</h4>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={32} className="site-detail mt-12 mb-12">
        <Col span={24}>
          <div className="detail bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">详细信息</h2>
            <div className="detail text-gray-600 leading-relaxed whitespace-pre-wrap">
              {detail.desc}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
