export const GLOBAL_ROOT_CATEGORY_ID = '4bvirtualcb9ff050738cc16';
export const DEFAULT_GROUP_SLUG = 'linuxdo';
export const DEFAULT_GROUP_NAME = 'LinuxDo';
export const DEFAULT_GROUP_DESC = 'Users authenticated via LinuxDo';

export const DEFAULT_ROLES = {
  sysadmin: {
    slug: 'sysadmin',
    displayName: 'Super Admin',
    isSystem: true,
    permissions: ['*'],
  },
  admin: {
    slug: 'admin',
    displayName: 'Admin',
    isSystem: true,
    permissions: [
      'nav:list','nav:read','nav:create','nav:update','nav:delete',
      'category:list','category:read','category:create','category:update','category:delete',
      'tag:list','tag:read','tag:create','tag:update','tag:delete',
      'urlChecker:read','urlChecker:manage',
      'inviteCode:read','inviteCode:manage',
      'user:list','user:read',
      'application:read',
    ],
  },
  editor: {
    slug: 'editor',
    displayName: 'Editor',
    isSystem: false,
    permissions: [
      'nav:create','nav:update',
      'category:create','category:update',
      'tag:create','tag:update',
      'nav:list','nav:read',
      'category:list','category:read',
      'tag:list','tag:read',
    ],
  },
  moderator: {
    slug: 'moderator',
    displayName: 'Moderator',
    isSystem: false,
    permissions: ['nav:audit','nav:list','nav:read'],
  },
  user: {
    slug: 'user',
    displayName: 'User',
    isSystem: true,
    permissions: [
      'favorites:list','favorites:read','favorites:create','favorites:update','favorites:delete',
      'nav:list','nav:read',
      'category:list','category:read',
    ],
  },
  viewer: {
    slug: 'viewer',
    displayName: 'Viewer',
    isSystem: true,
    permissions: ['nav:list','nav:read','category:list','category:read'],
  },
} as const;

export const DEFAULT_CATEGORIES: Array<{ name: string; description: string; icon: string }> = [
  { name: 'Tech & Dev', description: 'Programming, tools, development resources, coding platforms, web development, mobile development, DevOps & infrastructure', icon: 'type:emoji_💻' },
  { name: 'Design', description: 'UI/UX design, graphic design, creative tools, photography, video & animation, color palettes, fonts & typography, design inspiration', icon: 'type:emoji_🎨' },
  { name: 'Business', description: 'Marketing, finance, entrepreneurship, startup resources, SEO, analytics & data, project management, business news', icon: 'type:emoji_💼' },
  { name: 'Learn', description: 'Courses, tutorials, education platforms, online learning, certification, academic research, libraries & references', icon: 'type:emoji_📚' },
  { name: 'Social', description: 'Networks, communities, communication tools, social platforms, messaging apps, forums, blog platforms', icon: 'type:emoji_👥' },
  { name: 'Media', description: 'Streaming, entertainment, content platforms, gaming, music & audio, movies & TV, books & reading, podcasts', icon: 'type:emoji_🎬' },
  { name: 'Tools', description: 'Utilities, software, productivity apps, file management, image/video editors, password managers, browser extensions', icon: 'type:emoji_🔧' },
  { name: 'Shop', description: 'E-commerce, marketplaces, deals, online stores, price comparison, coupons, payment services, product reviews', icon: 'type:emoji_🛒' },
  { name: 'Life', description: 'Health, travel, lifestyle, personal growth, fitness & exercise, nutrition, mental health, fashion & beauty', icon: 'type:emoji_🌟' },
  { name: 'Science', description: 'Research, data, academic resources, scientific journals, data visualization, climate & environment, open data', icon: 'type:emoji_🔬' },
];

export const DEFAULT_WEBSITES: Record<string, Array<{ name: string; href: string; desc?: string; logo?: string }>> = {
  'Tech & Dev': [
    { name: 'GitHub', href: 'https://github.com', desc: 'Platform for version control and collaboration on code projects', logo: 'https://github.githubassets.com/favicons/favicon.svg' },
    { name: 'Stack Overflow', href: 'https://stackoverflow.com', desc: 'Question and answer site for programmers', logo: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png' },
  ],
  'Design': [
    { name: 'Dribbble', href: 'https://dribbble.com', desc: 'Showcase and discover the latest work from designers', logo: 'https://cdn.dribbble.com/assets/dribbble-ball-192-23ecbdf9874d870d2767376ecf8a3b62f1b97f7f8b6c302ecb727e64d1de23ff.png' },
    { name: 'Behance', href: 'https://www.behance.net', desc: 'Showcase and discover creative work', logo: 'https://a5.behance.net/2acd323b10e8e8b7d2e4d2a90c93e1af02b6e6e2/img/site/apple-touch-icon-180x180.png' },
  ],
  'Business': [
    { name: 'LinkedIn', href: 'https://www.linkedin.com', desc: 'Professional networking and career development platform', logo: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca' },
    { name: 'Bloomberg', href: 'https://www.bloomberg.com', desc: 'Business and financial news, data and analysis', logo: 'https://assets.bwbx.io/s3/javelin/public/website/icons/apple-icon-180x180-a40d72455b3a4d6a315c6b72455b3a4d6a315c.png' },
  ],
  'Learn': [
    { name: 'Coursera', href: 'https://www.coursera.org', desc: 'Online courses from top universities and companies', logo: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/android-chrome-512x512.50a040346ba4.png' },
    { name: 'Khan Academy', href: 'https://www.khanacademy.org', desc: 'Free online courses, lessons and practice', logo: 'https://cdn.kastatic.org/images/apple-touch-icon-76x76-precomposed.new.png' },
  ],
  'Social': [
    { name: 'Twitter', href: 'https://twitter.com', desc: 'Social media platform for microblogging and social networking', logo: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png' },
    { name: 'Reddit', href: 'https://www.reddit.com', desc: 'Social news aggregation and discussion website', logo: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png' },
  ],
  'Media': [
    { name: 'YouTube', href: 'https://www.youtube.com', desc: 'Video sharing and social media platform', logo: 'https://www.youtube.com/favicon.ico' },
    { name: 'Netflix', href: 'https://www.netflix.com', desc: 'Streaming entertainment service', logo: 'https://www.netflix.com/favicon.ico' },
  ],
  'Tools': [
    { name: 'Google Drive', href: 'https://drive.google.com', desc: 'Cloud storage and file synchronization service', logo: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
    { name: 'Slack', href: 'https://slack.com', desc: 'Collaboration hub and messaging platform for teams', logo: 'https://a.slack-edge.com/80588/img/icons/icon_128.png' },
  ],
  'Shop': [
    { name: 'Amazon', href: 'https://www.amazon.com', desc: 'Online shopping and e-commerce platform', logo: 'https://images-na.ssl-images-amazon.com/images/G/01/Amazon-www/mobile/Amazon_logo_PNG.png' },
    { name: 'eBay', href: 'https://www.ebay.com', desc: 'Online auction and shopping website', logo: 'https://ebay.rlcdn.com/str/i/ebay-logo-wordmark-2022.svg' },
  ],
  'Life': [
    { name: 'WebMD', href: 'https://www.webmd.com', desc: 'Medical information and health news', logo: 'https://img.webmd.com/dtmcms/live/webmd/consumer_assets/site_images/layout_elements/webmd_apple_touch_icon.png' },
    { name: 'TripAdvisor', href: 'https://www.tripadvisor.com', desc: 'Travel reviews and booking platform', logo: 'https://www.tripadvisor.com/img/cdsi/apple-touch-icon-180x180-75be004d1a0a89f1ce6a78768a22d5d4-180.png' },
  ],
  'Science': [
    { name: 'NASA', href: 'https://www.nasa.gov', desc: 'Official website of National Aeronautics and Space Administration', logo: 'https://www.nasa.gov/wp-content/themes/nasa_theme/images/nasa-logo.svg' },
    { name: 'PubMed', href: 'https://pubmed.ncbi.nlm.nih.gov', desc: 'Database of medical literature and research', logo: 'https://www.ncbi.nlm.nih.gov/coreutils/nwds/img/favicons/pmc.png' },
  ],
};

export function nowChromeTime(): number {
  const chromeEpochStart = 11644473600; // seconds
  const unixTimestamp = Math.floor(Date.now() / 1000);
  return (unixTimestamp + chromeEpochStart) * 1000000; // microseconds
}
