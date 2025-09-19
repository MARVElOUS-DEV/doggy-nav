'use client'
import { useState, useEffect } from 'react'
import { Grid, Tooltip, Message, Spin } from '@arco-design/web-react'
import axios from '@/utils/axios'
import { API_NAV, API_NAV_RANDOM } from '@/utils/api'
import Link from 'next/link'
import Image from 'next/image'
import { NavItem } from '@/types';
import { useParams } from 'next/navigation';

const { Row, Col } = Grid

export default function NavDetail() {
    const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<NavItem| null>(null)
  const [randomNavList, setRandomNavList] = useState<NavItem[]>([])
  const [isStar, setIsStar] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [detailRes, randomRes] = await Promise.all([
        axios.get(`${API_NAV}?id=${params.id}`),
        axios.get(API_NAV_RANDOM),
      ])
      setDetail(detailRes.data)
      setRandomNavList(randomRes.data)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const handleNavStarFn = async () => {
    if (detail) {
      
      try {
        await axios.post('/api/nav/star', { id: detail?._id })
        setIsStar(true)
        setDetail({ ...detail, star: detail.star + 1 })
      } catch (error) {
        Message.error('点赞失败')
      }
    }
  }

  const handleNavClick = (detail: NavItem) => {
    window.open(detail.href, '_blank')
  }

  const getRandomNavList = async () => {
    setLoading(true)
    const res = await axios.get(API_NAV_RANDOM)
    setLoading(false)
    setRandomNavList(res.data)
  }

  if (!detail) {
    return <Spin />
  }

  return (
    <div className="container p-4 mx-auto">
      {loading && <Spin />}
      <Row gutter={25} className="site-info mt-12">
        <Col md={6} xs={24} className="item">
          <div className="left bg-gray-200 rounded-lg p-5 relative shadow-lg">
            <div className="img-wrap h-48 flex items-center justify-center">
              <Link href="/">
                <Image src={detail.logo} alt={detail.name} width={100} height={100} className="object-cover" />
              </Link>
            </div>
            <div className="tool absolute bottom-5 left-1/2 transform -translate-x-1/2 flex">
              <Tooltip content="访问数">
                <div className="tool-item flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-full shadow-md text-gray-600">
                  <i className="iconfont icon-attentionfill"></i>
                  <p className="m-0 text-xs">{detail.view}</p>
                </div>
              </Tooltip>
              <div style={{ width: '30px' }}></div>
              <Tooltip content="点赞数">
                <div
                  className={`tool-item flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-full shadow-md cursor-pointer ${
                    isStar ? 'text-blue-500' : 'text-gray-600'
                  }`}
                  onClick={handleNavStarFn}
                >
                  <i className="iconfont icon-appreciatefill"></i>
                  <p className="m-0 text-xs">{detail.star}</p>
                </div>
              </Tooltip>
            </div>
          </div>
        </Col>
        <Col md={10} xs={24} className="item">
          <div className="content">
            <h1 className="title text-3xl font-bold my-5">{detail.name}</h1>
            <p className="desc text-base mb-5">{detail.desc}</p>
            {detail.tags.length > 0 && (
              <p className="tags mb-5">
                标签：
                {detail.tags.map((tag: string, index: number) => (
                  <span key={tag}>{index !== 0 ? '，' : ''}{tag}</span>
                ))}
              </p>
            )}
            {detail.authorName && (
              <p className="author">
                <span className="el-icon-user-solid"></span>
                <span>推荐人：</span>
                <a href={detail.authorUrl}>{detail.authorName}</a>
              </p>
            )}
            <div className="btn-group flex">
              <div
                onClick={() => handleNavClick(detail)}
                className="btn-link btn-group-item bg-gray-300 text-gray-700 px-5 py-2 rounded-md flex items-center cursor-pointer hover:bg-black hover:text-white transition-all"
              >
                链接直达
                <i className="iconfont icon-Icons_ToolBar_ArrowRight ml-2 text-xs"></i>
              </div>
            </div>
          </div>
        </Col>
        <Col md={8} xs={24} className="item">
          <div className="right">
            <div className="app-card border-2 border-gray-200 bg-gray-50">
              <div className="app-card-header flex justify-between p-5">
                <h3 className="app-card-title m-0">随机网址</h3>
                <div className="app-card-extra">
                  <i
                    className="iconfont icon-shuaxin cursor-pointer"
                    onClick={getRandomNavList}
                  ></i>
                </div>
              </div>
              <div className="app-card-content flex flex-wrap p-5 pt-0">
                <Row gutter={10}>
                  {randomNavList.map((item) => (
                    <Col span={12} key={item._id}>
                      <Link href={`/nav/${item._id}`} className="nav-block flex items-center p-1 bg-gray-100 border border-transparent text-gray-700 hover:opacity-80 mb-2">
                        <Image src={item.logo} alt="" className="nav-logo w-5 h-5 mr-2" width={20} height={20}/>
                        <h4 className="nav-name m-0 truncate">{item.name}</h4>
                      </Link>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={20} className="site-detail mt-72">
        <Col span={18}>
          <div className="detail text-base">{detail.desc}</div>
        </Col>
        <Col span={6}>
          <aside></aside>
        </Col>
      </Row>
    </div>
  )
}
