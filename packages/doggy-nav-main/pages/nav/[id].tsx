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
    id: '',
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
        await api.updateNavStar(detail.id)
        setIsStar(true)
        setDetail({ ...detail, star: detail.star + 1 })
      } catch (error) {
        console.error('Star failed', error)
      }
    }
  }

  const handleNavClick = async (detail: NavItem) => {
    try {
      await api.updateNavView(detail.id)
    } catch (e) {
      // ignore
    }
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
    <div className="container p-4 mx-auto max-w-7xl text-theme-foreground transition-colors">
      {loading && <Spin />}
      <Row gutter={32} className="site-info mt-8">
        <Col md={8} xs={24} className="item">
          <div className="shiny left rounded-xl shadow-lg p-6 relative border border-theme-border bg-theme-background transition-colors">
            <div className="img-wrap h-56 flex items-center justify-center bg-theme-muted border border-theme-border rounded-lg transition-colors">
              <Link href={detail.href} target="_blank" rel="noopener noreferrer">
                <Image src={detail.logo} alt={detail.name} width={120} height={120} className="object-cover rounded-lg shadow-md" />
              </Link>
            </div>
            <div className="tool absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Tooltip content="访问数">
                <div
                  className="tool-item flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-md transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 18%, var(--color-card))',
                    color: 'var(--color-primary)'
                  }}
                >
                  <i className="iconfont icon-attentionfill text-lg"></i>
                  <p className="m-0 text-xs font-medium">{detail.view}</p>
                </div>
              </Tooltip>
              <Tooltip content="点赞数">
                <div
                  className="tool-item flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-md cursor-pointer transition-colors"
                  style={
                    isStar
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--color-destructive) 20%, var(--color-card))',
                          color: 'var(--color-destructive)'
                        }
                      : {
                          backgroundColor: 'color-mix(in srgb, var(--color-muted) 80%, transparent)',
                          color: 'var(--color-muted-foreground)'
                        }
                  }
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
            <h1 className="title text-4xl font-bold mb-4">{detail.name}</h1>
            <p className="desc text-lg text-theme-muted-foreground mb-6 leading-relaxed">{detail.desc}</p>
            {(detail?.tags?.length??0) > 0 && (
              <div className="tags mb-6">
                <span className="text-theme-muted-foreground font-medium mr-2">标签：</span>
                {detail?.tags?.map((tag: string, index: number) => (
                  <span
                    key={tag}
                    className="inline-block text-sm px-3 py-1 rounded-full mr-2 mb-2"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {detail.authorName && (
              <div className="author mb-6 flex items-center text-theme-muted-foreground">
                <span className="mr-2">👤</span>
                <span className="mr-2">推荐人：</span>
                <a href={detail.authorUrl} className="text-theme-primary hover:opacity-80 transition-opacity font-medium">
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
          <div className="app-card bg-theme-background text-theme-foreground rounded-xl shadow-lg border border-theme-border overflow-hidden transition-colors">
            <div className="app-card-header flex justify-between items-center p-6 border-b border-theme-border">
              <h3 className="app-card-title m-0 text-xl font-bold">随机网址</h3>
              <div className="app-card-extra">
                <i
                  className="iconfont icon-shuaxin cursor-pointer text-theme-muted-foreground hover:text-theme-primary transition-colors text-lg"
                  onClick={getRandomNavList}
                ></i>
              </div>
            </div>
            <div className="app-card-content p-6">
              <Row gutter={[16, 16]}>
                {randomNavList.map((item) => (
                  <Col span={12} sm={8} md={6} key={item.id}>
                    <Link
                      href={`/nav/${item.id}`}
                      className="nav-block flex items-center p-3 border rounded-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-muted) 85%, transparent)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-muted-foreground)'
                      }}
                    >
                      <Image src={item.logo} alt={item.name} className="nav-logo w-6 h-6 mr-3 rounded" width={24} height={24}/>
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
          <div className="detail bg-theme-background text-theme-foreground rounded-xl shadow-lg p-8 border border-theme-border transition-colors">
            <h2 className="text-2xl font-bold mb-4">详细信息</h2>
            <div className="detail text-theme-muted-foreground leading-relaxed whitespace-pre-wrap">
              {detail.desc}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
