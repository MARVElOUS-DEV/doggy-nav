import dayjs from 'dayjs';
import { NavItem } from '@/types';
import { TimelineYear, TimelineItem } from '@/types/timeline';

// 年份颜色主题
const YEAR_COLORS = [
  '#3B82F6', // 蓝色
  '#8B5CF6', // 紫色
  '#06B6D4', // 青色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#EC4899', // 粉色
  '#6366F1', // 靛蓝色
];

// 获取网站添加的季度
export function getQuarter(date: string | Date): number {
  const month = dayjs(date).month();
  return Math.floor(month / 3) + 1;
}

// 检查网站是否有有效的创建时间
function hasValidCreateTime(website: NavItem): boolean {
  return website.createTime !== undefined && website.createTime !== null && website.createTime !== '';
}

// 安全获取日期值，处理可能为undefined的情况
function getValidDate(date: string | undefined): string | Date {
  if (!date) {
    // 如果没有日期，返回一个默认日期（比如5年前）
    return dayjs().subtract(2, 'year').format('YYYY-MM-DD');
  }
  return date;
}


// 生成年份范围
export function generateYearRange(startYear: number, endYear: number): TimelineYear[] {
  const years: TimelineYear[] = [];

  for (let year = startYear; year <= endYear; year++) {
    years.push({
      year,
      totalWebsites: 0,
      featuredWebsites: [],
      color: YEAR_COLORS[year % YEAR_COLORS.length],
      position: { x: 0, y: 0, z: 0, rotation: 0 },
      items: [],
    });
  }

  return years;
}

// 获取最近几年的年份范围
export function getRecentYears(count = 5): TimelineYear[] {
  const currentYear = dayjs().year();
  const startYear = currentYear - count + 1;
  return generateYearRange(startYear, currentYear);
}

// 获取网站的总年份范围
export function getWebsiteYearRange(websites: NavItem[]): number[] {
  const years = new Set<number>();

  websites.forEach(website => {
    if (hasValidCreateTime(website)) {
      years.add(dayjs(website.createTime).year());
    }
  });

  return Array.from(years).sort((a, b) => a - b);
}

// 时间轴数据工厂函数
export function createTimelineData(websites: NavItem[], useRecentYears = true): TimelineYear[] {
  if (!websites || websites.length === 0) {
    return getRecentYears(); // 默认显示最近5年
  }

  // 按年份分组网站数据
  const yearsWithWebsites = groupWebsitesByYear(websites);

  if (useRecentYears) {
    // 获取最近的年份范围
    const allYears = getWebsiteYearRange(websites);
    const recentYears = allYears.length > 0
      ? generateYearRange(Math.max(...allYears) - 4, Math.max(...allYears))
      : getRecentYears();

    // 合并数据，保留年份框架但使用实际网站数据
    return recentYears.map(recentYear => {
      const yearWithWebsites = yearsWithWebsites.find(y => y.year === recentYear.year);
      return yearWithWebsites || recentYear;
    });
  }

  return yearsWithWebsites;
}

// 创建模拟的TimelineItem数据 - 按月分组的时间线数据
export function createMockTimelineData(t?: (key: string) => string): TimelineYear[] {
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12月

  // 创建一个映射，用于存储每月的项目
  const monthlyItems: Record<number, TimelineItem[]> = {};
  months.forEach(month => monthlyItems[month] = []);

  // 生成当前年份的数据，分配到不同的月份
  const totalWebsites = 12;

  for (let i = 0; i < totalWebsites; i++) {
    const month = Math.floor(Math.random() * 12) + 1; // 1-12月
    const day = Math.floor(Math.random() * 28) + 1; // 1-28号

    const websiteNames = [
      'GitHub', 'Stack Overflow', 'MDN Web Docs', 'CSS-Tricks', 'Can I Use',
      'Figma', 'Dribbble', 'Behance', 'Adobe XD', 'Sketch',
      'Notion', 'Slack', 'Zoom', 'Google Workspace', 'Dropbox',
      'VS Code', 'Sublime Text', 'IntelliJ', 'WebStorm', 'Netlify',
      'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js',
      'Tailwind CSS', 'Bootstrap', 'Sass', 'CSS-in-JS', 'Styled Components'
    ];

    const descriptions = [
      t ? t('excellent_dev_tool') : '这是一个非常优秀的开发工具，大大提升了开发效率',
      t ? t('professional_collaboration_platform') : '专业的在线协作平台，团队成员可以实时协作',
      t ? t('powerful_code_editor') : '强大的代码编辑器，支持多种编程语言和插件',
      t ? t('modern_framework') : '现代化的框架，让前端开发变得更加简单高效',
      t ? t('cloud_service_platform') : '云服务平台，提供了稳定可靠的基础设施',
      t ? t('essential_design_tool') : '设计师的必备工具，提供了丰富的设计资源和灵感',
      t ? t('project_management_tool') : '项目管理工具，让团队协作变得更加井然有序',
      t ? t('documentation_platform') : '文档平台，提供了详尽的开发文档和教程',
      t ? t('online_code_repo') : '在线代码仓库，支持版本控制和团队协作',
      t ? t('frontend_framework') : '前端框架，让构建用户界面变得更加简单'
    ];

    const categories = [
      t ? t('development_tool') : '开发工具',
      t ? t('design_platform') : '设计平台',
      t ? t('cloud_service') : '云服务',
      t ? t('framework_library') : '框架库',
      t ? t('project_management') : '项目管理',
      t ? t('frontend_development') : '前端开发'
    ];
    const statusTypes: ('active' | 'inactive' | 'pending')[] = ['active', 'active', 'active', 'active', 'inactive', 'pending'];

    const websiteName = websiteNames[Math.floor(Math.random() * websiteNames.length)];
    const siteIndex = Math.floor(Math.random() * 1000);

    const timelineItem: TimelineItem = {
      id: `current-year-${currentYear}-month-${month}-site-${i}`,
      title: `${websiteName} ${siteIndex}`,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      url: `https://example${siteIndex}.com`,
      createdAt: `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`,
      status: statusTypes[Math.floor(Math.random() * statusTypes.length)],
      tags: [`${currentYear}`, `Month${month}`, categories[Math.floor(Math.random() * categories.length)]],
      category: categories[Math.floor(Math.random() * categories.length)],
      logo: `https://picsum.photos/seed/${websiteName}-${siteIndex}/40/40.jpg`
    };

    monthlyItems[month].push(timelineItem);
  }

  // 按月份组织数据，并在每个月内按日期排序
  const allTimelineItems: TimelineItem[] = [];
  months.forEach(month => {
    // 按日期排序（最新的在前）
    monthlyItems[month].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    allTimelineItems.push(...monthlyItems[month]);
  });

  // 全局按日期排序（最新的在前）
  allTimelineItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const yearData: TimelineYear = {
    year: currentYear,
    totalWebsites: allTimelineItems.length,
    featuredWebsites: [], // 保持向后兼容
    color: YEAR_COLORS[currentYear % YEAR_COLORS.length],
    position: { x: 0, y: 0, z: 0, rotation: 0 },
    items: allTimelineItems
  };

  return [yearData];
}

// 专门针对NavItem的分组函数（向后兼容）
export function groupWebsitesByYear(websites: NavItem[]): TimelineYear[] {
  const yearMap = new Map<number, TimelineYear>();

  websites.forEach(website => {
    if (!hasValidCreateTime(website)) return;

    const validDate = getValidDate(website.createTime);
    const year = dayjs(validDate).year();

    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        totalWebsites: 0,
        featuredWebsites: [],
        color: YEAR_COLORS[year % YEAR_COLORS.length],
        position: { x: 0, y: 0, z: 0, rotation: 0 },
        items: []
      });
    }

    const yearData = yearMap.get(year);
    if (!yearData) return;

    yearData.totalWebsites++;

    // 添加到线性时间轴项目
    yearData.items.push({
      id: website.id || website.href || `item-${Math.random()}`,
      title: website.name || 'Unknown',
      description: website.desc || '',
      url: website.href || '#',
      createdAt: validDate.toString(),
      status: website.status === 1 ? 'active' : 'inactive',
      tags: website.tags || [],
      category: website.categoryName || '',
      logo: website.logo
    });

    // 添加到精选网站（按点赞数排序，保留前20个）
    yearData.featuredWebsites.push(website);
    yearData.featuredWebsites.sort((a: NavItem, b: NavItem) => (b.star || 0) - (a.star || 0));
    yearData.featuredWebsites = yearData.featuredWebsites.slice(0, 20);
  });

  // 转换为数组并按年份排序
  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
}