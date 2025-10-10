import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import TimelineContainer from '@/components/Timelines/TimelineContainer';
import { TimelineYear, TimelineItem } from '@/types/timeline';
import { NavItem } from '@/types';
import { createMockTimelineData } from '@/utils/timelineData';

// Create mock NavItem data for testing
const createMockNavItems = (): NavItem[] => {
  const mockItems: NavItem[] = [];
  const currentYear = new Date().getFullYear();

  // Generate mock websites for the last few years
  for (let i = 0; i < 50; i++) {
    const randomYear = Math.floor(Math.random() * 4) + (currentYear - 4); // Last 5 years
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;

    const websiteNames = [
      'GitHub', 'Stack Overflow', 'MDN Web Docs', 'CSS-Tricks', 'Can I Use',
      'Figma', 'Dribbble', 'Behance', 'Adobe XD', 'Sketch',
      'Notion', 'Slack', 'Zoom', 'Google Workspace', 'Dropbox',
      'VS Code', 'Sublime Text', 'IntelliJ', 'WebStorm', 'Netlify',
      'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js',
      'Tailwind CSS', 'Bootstrap', 'Sass', 'CSS-in-JS', 'Styled Components',
      'AWS', 'Azure', 'Google Cloud', 'Heroku', 'Vercel',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch'
    ];

    const descriptions = [
      '这是一个非常优秀的开发工具，大大提升了开发效率',
      '专业的在线协作平台，团队成员可以实时协作',
      '强大的代码编辑器，支持多种编程语言和插件',
      '现代化的框架，让前端开发变得更加简单高效',
      '云服务平台，提供了稳定可靠的基础设施',
      '设计师的必备工具，提供了丰富的设计资源和灵感',
      '项目管理工具，让团队协作变得更加井然有序',
      '文档平台，提供了详尽的开发文档和教程',
      '在线代码仓库，支持版本控制和团队协作',
      '前端框架，让构建用户界面变得更加简单'
    ];

    const categories = [
      '开发工具', '设计平台', '云服务', '框架库', '项目管理', '前端开发', '后端开发', '数据库'
    ];

    const websiteName = websiteNames[Math.floor(Math.random() * websiteNames.length)];
    const siteIndex = Math.floor(Math.random() * 1000);

    mockItems.push({
      id: `site-${i}`,
      categoryId: `category-${Math.floor(Math.random() * 5)}`,
      categoryName: categories[Math.floor(Math.random() * categories.length)],
      name: `${websiteName} ${siteIndex}`,
      href: `https://example${siteIndex}.com`,
      desc: descriptions[Math.floor(Math.random() * descriptions.length)],
      logo: `https://picsum.photos/seed/${websiteName}-${siteIndex}/40/40.jpg`,
      authorName: `Author ${Math.floor(Math.random() * 100)}`,
      authorUrl: `https://author${Math.floor(Math.random() * 100)}.com`,
      createTime: `${randomYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      tags: [
        `${randomYear}`,
        categories[Math.floor(Math.random() * categories.length)],
        `Tag${Math.floor(Math.random() * 10) + 1}`
      ],
      view: Math.floor(Math.random() * 1000),
      star: Math.floor(Math.random() * 100),
      status: 1, // Active status
    });
  }

  return mockItems;
};

const TimelinePage: React.FC = () => {
  const [years, setYears] = useState<TimelineYear[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mock data
    const mockNavItems = createMockNavItems();

    // Create timeline data from mock items
    const timelineData = createMockTimelineData();

    // Add a few more years with mock data to show the full timeline
    const currentYear = new Date().getFullYear();
    const additionalYears: TimelineYear[] = [];

    for (let yearOffset = 1; yearOffset <= 4; yearOffset++) {
      const year = currentYear - yearOffset;
      const yearItems: TimelineItem[] = [];

      // Create some items for this year
      for (let i = 0; i < 8; i++) {
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;

        const websiteNames = [
          'GitHub', 'Stack Overflow', 'MDN Web Docs', 'CSS-Tricks', 'Can I Use',
          'Figma', 'Dribbble', 'Behance', 'Adobe XD', 'Sketch'
        ];

        const descriptions = [
          '这是一个非常优秀的开发工具，大大提升了开发效率',
          '专业的在线协作平台，团队成员可以实时协作',
          '强大的代码编辑器，支持多种编程语言和插件',
          '现代化的框架，让前端开发变得更加简单高效'
        ];

        const websiteName = websiteNames[Math.floor(Math.random() * websiteNames.length)];
        const siteIndex = Math.floor(Math.random() * 1000);

        yearItems.push({
          id: `year-${year}-item-${i}`,
          title: `${websiteName} ${siteIndex}`,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          url: `https://example${siteIndex}.com`,
          createdAt: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`,
          status: 'active',
          tags: [`${year}`, 'Featured'],
          category: 'Development Tools',
          logo: `https://picsum.photos/seed/${websiteName}-${siteIndex}/40/40.jpg`
        });
      }

      additionalYears.push({
        year,
        totalWebsites: yearItems.length,
        featuredWebsites: [],
        color: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][yearOffset % 5],
        position: { x: 0, y: 0, z: 0, rotation: 0 },
        items: yearItems
      });
    }

    // Combine current year data with additional years and sort by year
    const allYears = [...additionalYears, ...timelineData].sort((a, b) => b.year - a.year);
    setYears(allYears);

    setLoading(false);
  }, []);

  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
    // You can add more logic here for when an item is clicked
    console.log('Timeline item clicked:', item);
  };

  const handleYearClick = (year: number) => {
    // You can add more logic here for when a year is clicked
    console.log('Timeline year clicked:', year);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Head>
        <title>网站时间轴 - Doggy Nav</title>
        <meta name="description" content="查看网站添加时间轴，了解网站收录历史" />
      </Head>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {years.length > 0 ? (
          <TimelineContainer
            years={years}
            onItemClick={handleItemClick}
            onYearClick={handleYearClick}
            selectedItem={selectedItem || undefined}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无时间轴数据</p>
          </div>
        )}
      </main>

      {/* Selected Item Panel */}
      {selectedItem && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm w-full border">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{selectedItem.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{selectedItem.description}</p>
              <p className="text-gray-500 text-xs mt-2">{new Date(selectedItem.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="mt-3">
            <a
              href={selectedItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              访问网站
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;