import EnhancedCard from '@/components/EnhancedCard';
import { API_CATEGORY_LIST, API_NAV_LIST, API_TAG_list } from '@/services/api';
import request from '@/utils/request';
import {
  AppstoreOutlined,
  HeartTwoTone,
  RocketOutlined,
  TagsOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Col, Row, Space, Statistic, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Title, Paragraph } = Typography;

export default (): React.ReactNode => {
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [tagCount, setTagCount] = useState<number>(0);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [totalNavCount, setTotalNavCount] = useState<number>(0);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    async function fetchCounts() {
      try {
        const [
          catRes,
          tagRes,
          navApprovedRes,
          navPendingRes,
          navRejectedRes,
          navNoStatusRes,
        ] = await Promise.all([
          request({ url: API_CATEGORY_LIST, method: 'GET' }).catch(() => null),
          request({ url: API_TAG_list, method: 'GET' }).catch(() => null),
          request({
            url: API_NAV_LIST,
            method: 'GET',
            data: { status: '0' },
          }).catch(() => null), // Approved items
          request({
            url: API_NAV_LIST,
            method: 'GET',
            data: { status: '1' },
          }).catch(() => null), // Pending items
          request({
            url: API_NAV_LIST,
            method: 'GET',
            data: { status: '2' },
          }).catch(() => null), // Rejected items
          request({
            url: API_NAV_LIST,
            method: 'GET',
            data: { status: '' },
          }).catch(() => null), // Items without status
        ]);
        if (!mountedRef.current) return;

        // category list returns nested tree; count all nodes including children
        const cats = catRes?.data || [];
        const countCats = (arr: any[]): number =>
          arr.reduce(
            (acc: number, item: any) =>
              acc +
              1 +
              (Array.isArray(item.children) ? countCats(item.children) : 0),
            0,
          );
        setCategoryCount(countCats(cats));

        setTagCount(Number(tagRes?.data?.total || 0));

        // Calculate counts
        const approvedCount = navApprovedRes.data?.total ?? 0;
        const pendingCount = navPendingRes.data?.total ?? 0;
        const rejectedCount = navRejectedRes.data?.total ?? 0;
        const noStatusCount = navNoStatusRes.data?.total ?? 0;

        // Total count is sum of all categories
        const totalCount =
          approvedCount + pendingCount + rejectedCount + noStatusCount;

        // Set the counts
        setTotalNavCount(totalCount);
        setAuditCount(pendingCount);
      } catch (e) {
        // ignore errors for dashboard
      }
    }
    fetchCounts();
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

      <EnhancedCard gradient="primary" elevation="medium">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
            欢迎使用狗狗导航管理系统 <HeartTwoTone twoToneColor="#ff6b6b" />
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '16px',
              marginBottom: 24,
            }}
          >
            一个现代化、功能强大的导航网站管理平台
          </Paragraph>
          <Space size="large">
            <div
              style={{
                color: 'white',
                display: 'inline-block',
                padding: '0 16px',
              }}
            >
              <RocketOutlined
                style={{ fontSize: '24px', marginBottom: 8, display: 'block' }}
              />
              <div>高效管理</div>
            </div>
            <div
              style={{
                color: 'white',
                display: 'inline-block',
                padding: '0 16px',
              }}
            >
              <TrophyOutlined
                style={{ fontSize: '24px', marginBottom: 8, display: 'block' }}
              />
              <div>便捷审核</div>
            </div>
            <div
              style={{
                color: 'white',
                display: 'inline-block',
                padding: '0 16px',
              }}
            >
              <TrophyOutlined
                style={{ fontSize: '24px', marginBottom: 8, display: 'block' }}
              />
              <div>数据统计</div>
            </div>
          </Space>
        </div>
      </EnhancedCard>
    </>
  );
};
