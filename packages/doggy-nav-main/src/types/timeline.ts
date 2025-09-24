import { NavItem } from './index';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
  tags?: string[];
  category?: string;
  logo?: string;
}

export interface TimelineYear {
  year: number;
  totalWebsites: number;
  featuredWebsites: NavItem[];
  color: string; // 年份主题色
  position: TimelinePosition;
  items: TimelineItem[]; // 新增的线性时间轴项目
}

export interface TimelinePosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface YearNodeProps {
  year: TimelineYear;
  isActive: boolean;
  isExpanded: boolean;
  onClick: (year: number) => void;
}

export interface WebsiteCardProps {
  website: NavItem;
  index: number;
  delay: number;
}

export interface SpiralTimelineProps {
  years: TimelineYear[];
  onYearClick: (year: number) => void;
  selectedYear?: number;
  expandedYear?: number;
  rotation: number;
  onRotationChange: (rotation: number) => void;
}