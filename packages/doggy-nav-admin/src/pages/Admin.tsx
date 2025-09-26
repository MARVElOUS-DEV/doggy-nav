import React from 'react';
import { HeartTwoTone, SmileTwoTone, TrophyOutlined, RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Typography, Row, Col, Statistic, Space } from 'antd';
import EnhancedCard from '@/components/EnhancedCard';

const { Title, Paragraph } = Typography;

export default (): React.ReactNode => {
  return (
    <>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard gradient="primary" elevation="medium" style={{ height: '100%' }}>
            <Statistic
              title="总导航数量"
              value={128}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard gradient="secondary" elevation="medium" style={{ height: '100%' }}>
            <Statistic
              title="已审核"
              value={89}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard gradient="accent" elevation="medium" style={{ height: '100%' }}>
            <Statistic
              title="待审核"
              value={24}
              prefix={<RocketOutlined />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <EnhancedCard gradient="primary" elevation="medium" style={{ height: '100%' }}>
            <Statistic
              title="今日访问"
              value={1245}
              prefix={<SmileTwoTone twoToneColor="#fff" />}
              valueStyle={{ color: 'white', fontSize: '24px' }}
            />
          </EnhancedCard>
        </Col>
      </Row>

      <EnhancedCard gradient="primary" elevation="medium">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Title level={2} style={{ color: 'white', marginBottom: 16 }}>
            <SmileTwoTone /> 欢迎使用狗狗导航管理系统 <HeartTwoTone twoToneColor="#ff6b6b" />
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px', marginBottom: 24 }}>
            一个现代化、功能强大的导航网站管理平台
          </Paragraph>
          <Space size="large">
            <div style={{ color: 'white', display: 'inline-block', padding: '0 16px' }}>
              <RocketOutlined style={{ fontSize: '24px', marginBottom: 8, display: 'block' }} />
              <div>高效管理</div>
            </div>
            <div style={{ color: 'white', display: 'inline-block', padding: '0 16px' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', marginBottom: 8, display: 'block' }} />
              <div>便捷审核</div>
            </div>
            <div style={{ color: 'white', display: 'inline-block', padding: '0 16px' }}>
              <TrophyOutlined style={{ fontSize: '24px', marginBottom: 8, display: 'block' }} />
              <div>数据统计</div>
            </div>
          </Space>
        </div>
      </EnhancedCard>
    </>
  );
};
