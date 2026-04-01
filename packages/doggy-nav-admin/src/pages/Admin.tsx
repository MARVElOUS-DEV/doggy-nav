import EnhancedCard from '@/components/EnhancedCard';
import { API_CATEGORY_LIST, API_NAV_LIST, API_TAG_list } from '@/services/api';
import type { TagModel } from '@/types/api';
import request from '@/utils/request';
import {
  AppstoreOutlined,
  FireOutlined,
  HeartTwoTone,
  LineChartOutlined,
  RocketOutlined,
  SearchOutlined,
  TagsOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useLocation } from '@umijs/max';
import { Col, Empty, Input, Row, Segmented, Statistic, Typography } from 'antd';
import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import './Admin.less';

const { Title, Paragraph } = Typography;
const TAG_PAGE_SIZE = 200;
const INITIAL_VISIBLE_TAGS = 24;
const LOAD_MORE_TAGS = 24;

type TagViewMode = 'all' | 'popular' | 'longTail';

const countCats = (arr: any[]): number =>
  arr.reduce(
    (acc: number, item: any) =>
      acc + 1 + (Array.isArray(item.children) ? countCats(item.children) : 0),
    0,
  );

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    maximumFractionDigits: value >= 10000 ? 0 : 1,
  }).format(value);

async function fetchAllTags(): Promise<{ tags: TagModel[]; total: number }> {
  const firstResponse = await request({
    url: API_TAG_list,
    method: 'GET',
    data: {
      pageNumber: 1,
      pageSize: TAG_PAGE_SIZE,
    },
  }).catch(() => null);

  const firstPageTags = Array.isArray(firstResponse?.data?.data)
    ? firstResponse.data.data
    : [];
  const total = Number(firstResponse?.data?.total || 0);
  const totalPages = Math.max(
    Number(firstResponse?.data?.pageNumber || 1),
    Math.ceil(total / TAG_PAGE_SIZE),
    1,
  );

  if (totalPages <= 1) {
    return {
      tags: [...firstPageTags].sort(
        (a: TagModel, b: TagModel) =>
          Number(b.count || 0) - Number(a.count || 0) ||
          a.name.localeCompare(b.name, 'zh-CN'),
      ),
      total,
    };
  }

  const pageResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      request({
        url: API_TAG_list,
        method: 'GET',
        data: {
          pageNumber: index + 2,
          pageSize: TAG_PAGE_SIZE,
        },
      }).catch(() => null),
    ),
  );

  const mergedTagMap = new Map<string, TagModel>();

  [...firstPageTags, ...pageResponses.flatMap((page) => page?.data?.data || [])]
    .filter((item): item is TagModel => !!item?.id && !!item?.name)
    .forEach((item) => {
      const existing = mergedTagMap.get(item.id);
      mergedTagMap.set(item.id, {
        ...item,
        count: Number(item.count || 0) + Number(existing?.count || 0),
      });
    });

  return {
    tags: [...mergedTagMap.values()].sort(
      (a, b) =>
        Number(b.count || 0) - Number(a.count || 0) ||
        a.name.localeCompare(b.name, 'zh-CN'),
    ),
    total,
  };
}

export default function AdminDashboard(): React.ReactNode {
  const location = useLocation();
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [tagCount, setTagCount] = useState<number>(0);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [totalNavCount, setTotalNavCount] = useState<number>(0);
  const [tagList, setTagList] = useState<TagModel[]>([]);
  const [tagKeyword, setTagKeyword] = useState<string>('');
  const [tagViewMode, setTagViewMode] = useState<TagViewMode>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [tagLoading, setTagLoading] = useState<boolean>(true);
  const [visibleTagLimit, setVisibleTagLimit] =
    useState<number>(INITIAL_VISIBLE_TAGS);

  const mountedRef = useRef(true);
  const deferredTagKeyword = useDeferredValue(tagKeyword);

  useEffect(() => {
    async function fetchCounts() {
      setTagLoading(true);
      try {
        const [catRes, tagData, navTotalRes, navPendingRes] = await Promise.all(
          [
            request({ url: API_CATEGORY_LIST, method: 'GET' }).catch(
              () => null,
            ),
            fetchAllTags(),
            request({
              url: API_NAV_LIST,
              method: 'GET',
            }).catch(() => null),
            request({
              url: API_NAV_LIST,
              method: 'GET',
              data: { status: '1' },
            }).catch(() => null), // Pending items
          ],
        );
        if (!mountedRef.current) return;

        // category list returns nested tree; count all nodes including children
        const cats = catRes?.data || [];
        setCategoryCount(countCats(cats));

        setTagCount(Number(tagData?.total || 0));
        setTagList(Array.isArray(tagData?.tags) ? tagData.tags : []);

        const totalCount = Number(navTotalRes?.data?.total ?? 0);
        const pendingCount = Number(navPendingRes?.data?.total ?? 0);

        setTotalNavCount(totalCount);
        setAuditCount(pendingCount);
      } catch (e) {
        // ignore errors for dashboard
      } finally {
        if (mountedRef.current) {
          setTagLoading(false);
        }
      }
    }

    if (location.pathname !== '/nav/admin') return;

    mountedRef.current = true;
    fetchCounts();

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [location.pathname]);

  useEffect(() => {
    setVisibleTagLimit(INITIAL_VISIBLE_TAGS);
  }, [deferredTagKeyword, tagViewMode]);

  const maxTagCount = Number(tagList[0]?.count || 0);
  const hottestTag = tagList[0];
  const totalTagMentions = tagList.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0,
  );
  const longTailTagCount = tagList.filter(
    (item) => Number(item.count || 0) === 1,
  ).length;
  const popularTagCount = tagList.filter(
    (item) => Number(item.count || 0) >= 3,
  ).length;
  const rankingTags = tagList.slice(0, 5);
  const normalizedKeyword = deferredTagKeyword.trim().toLowerCase();
  const filteredTags = tagList
    .filter((item) => {
      const currentCount = Number(item.count || 0);
      if (tagViewMode === 'popular') return currentCount >= 3;
      if (tagViewMode === 'longTail') return currentCount === 1;
      return true;
    })
    .filter((item) =>
      normalizedKeyword
        ? item.name.toLowerCase().includes(normalizedKeyword)
        : true,
    );
  const visibleTags = filteredTags.slice(0, visibleTagLimit);
  const hasMoreTags = filteredTags.length > visibleTagLimit;

  return (
    <>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard
            gradient="primary"
            elevation="medium"
            style={{ height: '100%' }}
          >
            <Statistic
              title="总导航数量"
              value={totalNavCount}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard
            gradient="secondary"
            elevation="medium"
            style={{ height: '100%' }}
          >
            <Statistic
              title="分类数量"
              value={categoryCount}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard
            gradient="accent"
            elevation="medium"
            style={{ height: '100%' }}
          >
            <Statistic
              title="待审核"
              value={auditCount}
              prefix={<RocketOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard
            gradient="primary"
            elevation="medium"
            style={{ height: '100%' }}
          >
            <Statistic
              title="标签数量"
              value={tagCount}
              prefix={<TagsOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={15}>
          <EnhancedCard
            gradient="primary"
            elevation="medium"
            className="admin-overview-card"
          >
            <div className="admin-overview-card-header">
              <div className="admin-overview-card-intro">
                <div className="admin-overview-card-eyebrow">
                  Read-Only Tag Intelligence
                </div>
                <Title level={3} style={{ color: 'white', marginBottom: 12 }}>
                  标签总览 <HeartTwoTone twoToneColor="#ff6b6b" />
                </Title>
                <Paragraph className="admin-overview-card-description">
                  标签由系统自动聚合生成，通常由贡献用户在推荐页补充，管理员可以在导航列表编辑中更正或生成新的标签。
                </Paragraph>
              </div>

              <div className="admin-overview-card-stats">
                <div className="admin-overview-pill-stat">
                  <span>唯一标签</span>
                  <strong>{formatCompactNumber(tagCount)}</strong>
                </div>
                <div className="admin-overview-pill-stat">
                  <span>标签引用</span>
                  <strong>{formatCompactNumber(totalTagMentions)}</strong>
                </div>
                <div className="admin-overview-pill-stat">
                  <span>长尾标签</span>
                  <strong>{formatCompactNumber(longTailTagCount)}</strong>
                </div>
              </div>
            </div>

            <div className="admin-tag-toolbar">
              <Input.Search
                allowClear
                size="large"
                placeholder="搜索标签名称"
                prefix={<SearchOutlined />}
                value={tagKeyword}
                onChange={(event) => {
                  setTagKeyword(event.target.value);
                  if (!event.target.value) {
                    setSelectedTagId('');
                  }
                }}
              />
              <Segmented
                value={tagViewMode}
                onChange={(value) => setTagViewMode(value as TagViewMode)}
                options={[
                  { label: '全部', value: 'all' },
                  { label: '高频', value: 'popular' },
                  { label: '长尾', value: 'longTail' },
                ]}
              />
            </div>

            <div className="admin-tag-toolbar-meta">
              <span>
                当前显示 {visibleTags.length} / {filteredTags.length} 个标签
              </span>
              {selectedTagId ? (
                <button
                  className="admin-tag-toolbar-clear"
                  type="button"
                  onClick={() => {
                    setSelectedTagId('');
                    setTagKeyword('');
                    setTagViewMode('all');
                  }}
                >
                  清除聚焦
                </button>
              ) : (
                <span>点击标签可快速聚焦阅读</span>
              )}
            </div>

            {tagLoading ? (
              <div className="admin-tag-grid">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={`tag-loading-${index}`}
                    className="admin-tag-chip admin-tag-chip-placeholder"
                  />
                ))}
              </div>
            ) : visibleTags.length ? (
              <>
                <div className="admin-tag-grid">
                  {visibleTags.map((tag) => {
                    const intensity = maxTagCount
                      ? Number(tag.count || 0) / maxTagCount
                      : 0;

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`admin-tag-chip ${selectedTagId === tag.id ? 'is-active' : ''}`}
                        style={{
                          background: `rgba(255, 255, 255, ${
                            0.14 + intensity * 0.2
                          })`,
                          boxShadow: `0 10px 30px rgba(15, 23, 42, ${
                            0.08 + intensity * 0.12
                          })`,
                        }}
                        onClick={() => {
                          setSelectedTagId(tag.id);
                          setTagKeyword(tag.name);
                          setTagViewMode('all');
                        }}
                      >
                        <span className="admin-tag-chip-name">{tag.name}</span>
                        <span className="admin-tag-chip-count">
                          {tag.count || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {hasMoreTags ? (
                  <div className="admin-tag-toolbar-meta">
                    <button
                      className="admin-tag-toolbar-clear"
                      type="button"
                      onClick={() =>
                        setVisibleTagLimit(
                          (current) => current + LOAD_MORE_TAGS,
                        )
                      }
                    >
                      显示更多标签
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <Empty
                className="admin-tag-empty"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="没有匹配的标签"
              />
            )}
          </EnhancedCard>
        </Col>

        <Col xs={24} xl={9}>
          <EnhancedCard
            gradient="accent"
            elevation="medium"
            className="admin-overview-card"
          >
            <div className="admin-overview-card-eyebrow">Tag Signals</div>
            <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
              标签洞察
            </Title>
            <Paragraph className="admin-overview-card-description">
              用更少的视觉层级把最热标签、长尾分布和整体使用频次读出来。
            </Paragraph>

            <div className="admin-insight-grid">
              <div className="admin-insight-tile">
                <span>最热标签</span>
                <strong title={hottestTag?.name || '-'}>
                  {hottestTag?.name || '-'}
                </strong>
                <small>
                  {hottestTag
                    ? `${hottestTag.count || 0} 个导航使用`
                    : '暂无数据'}
                </small>
              </div>
              <div className="admin-insight-tile">
                <span>高频标签</span>
                <strong>{formatCompactNumber(popularTagCount)}</strong>
                <small>至少被 3 个导航复用</small>
              </div>
              <div className="admin-insight-tile">
                <span>标签引用</span>
                <strong>{formatCompactNumber(totalTagMentions)}</strong>
                <small>聚合后的总使用次数</small>
              </div>
              <div className="admin-insight-tile">
                <span>待审核提醒</span>
                <strong>{formatCompactNumber(auditCount)}</strong>
                <small>可优先关注新增内容的标签趋势</small>
              </div>
            </div>

            <div className="admin-tag-ranking">
              <div className="admin-tag-ranking-title">
                <FireOutlined />
                <span>热门标签排行</span>
              </div>
              {tagLoading ? (
                <div className="admin-tag-ranking-empty">标签加载中...</div>
              ) : rankingTags.length ? (
                rankingTags.map((tag, index) => {
                  const percent = maxTagCount
                    ? Math.max((Number(tag.count || 0) / maxTagCount) * 100, 10)
                    : 0;

                  return (
                    <div key={tag.id} className="admin-tag-ranking-item">
                      <div className="admin-tag-ranking-row">
                        <span className="admin-tag-ranking-index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="admin-tag-ranking-name">
                          {tag.name}
                        </span>
                        <span className="admin-tag-ranking-value">
                          {tag.count || 0}
                        </span>
                      </div>
                      <div className="admin-tag-ranking-track">
                        <div
                          className="admin-tag-ranking-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="admin-tag-ranking-empty">暂无标签数据</div>
              )}

              <div className="admin-tag-footnote">
                <LineChartOutlined />
                <span>
                  热门标签适合观察导航内容重心，长尾标签更适合排查细分站点覆盖。
                </span>
              </div>
            </div>
          </EnhancedCard>
        </Col>
      </Row>
    </>
  );
}
