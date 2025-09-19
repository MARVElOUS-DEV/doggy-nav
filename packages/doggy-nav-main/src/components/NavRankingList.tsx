import { Card, Grid } from '@arco-design/web-react';
import NavRanking from './NavRanking';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';

const { Row, Col } = Grid;

interface NavRankingListProps {
  data: {
    news: NavItem[];
    view: NavItem[];
    star: NavItem[];
  };
}

export default function NavRankingList({ data }: NavRankingListProps) {
  const { t } = useTranslation();

  return (
    <div className="nav-ranking-list">
      <Row gutter={20}>
        <Col md={8} sm={12}>
          <Card title={t('latest')} bordered={false} className="mt-8">
            {data.news.map((item) => (
              <NavRanking key={item.name} data={item} />
            ))}
          </Card>
        </Col>
        <Col md={8} sm={12}>
          <Card title={t('most_clicks')} bordered={false} className="mt-8">
            {data.view.map((item) => (
              <NavRanking key={item.name} data={item} countType="view" />
            ))}
          </Card>
        </Col>
        <Col md={8} sm={12}>
          <Card title={t('most_likes')} bordered={false} className="mt-8">
            {data.star.map((item) => (
              <NavRanking key={item.name} data={item} countType="star" />
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
