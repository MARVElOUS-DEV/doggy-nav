# Translation Card Tool

精美的卡片式翻译工具，支持多语言实时翻译。

## 功能特性

- ⚡ **自动翻译** - 停止输入 800ms 后自动触发翻译
- 🌍 **多语言支持** - 支持中文、英语、日语、韩语、法语、德语、西班牙语
- 💾 **记忆偏好** - 自动保存语言选择到 localStorage
- 📱 **响应式布局** - 桌面端左右分栏，移动端上下堆叠
- 🎨 **主题支持** - 自动适配亮色/暗色主题
- ♿ **可访问性** - 完整的 ARIA 标签和键盘导航支持
- 📋 **一键复制** - 快速复制翻译结果到剪贴板

## 使用方法

### 基础使用

```tsx
import TranslationCard from '@/tools/TranslationCard';

function MyPage() {
  return (
    <div>
      <TranslationCard />
    </div>
  );
}
```

### 自定义配置

```tsx
import TranslationCard from '@/tools/TranslationCard';

function MyPage() {
  return (
    <TranslationCard
      className="my-custom-class"
      defaultSourceLang="en"
      defaultTargetLang="zh"
      maxCharacters={3000}
    />
  );
}
```

## Props

| 属性                | 类型     | 默认值 | 说明             |
| ------------------- | -------- | ------ | ---------------- |
| `className`         | `string` | `''`   | 自定义 CSS 类名  |
| `defaultSourceLang` | `string` | `'zh'` | 默认源语言代码   |
| `defaultTargetLang` | `string` | `'en'` | 默认目标语言代码 |
| `maxCharacters`     | `number` | `5000` | 最大字符数限制   |

## 支持的语言

| 语言     | 代码 |
| -------- | ---- |
| 中文     | `zh` |
| English  | `en` |
| 日本語   | `ja` |
| 한국어   | `ko` |
| Français | `fr` |
| Deutsch  | `de` |
| Español  | `es` |

## 后端 API

翻译功能依赖后端 API 端点：

### POST /api/translate

**请求体：**

```json
{
  "text": "Hello, world!",
  "sourceLang": "en",
  "targetLang": "zh"
}
```

**响应：**

```json
{
  "translatedText": "你好，世界！",
  "sourceLang": "en",
  "targetLang": "zh"
}
```

**错误响应：**

```json
{
  "error": "Translation failed",
  "message": "Detailed error message"
}
```

## 技术栈

- **React 18+** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式系统
- **Arco Design** - UI 组件库
- **Axios** - HTTP 客户端
- **Google Translate API** - 翻译服务（免费）

## 组件结构

```
TranslationCard/
├── index.tsx              # 主组件
├── LanguageSelector.tsx   # 语言选择器
├── TranslationPanel.tsx   # 翻译面板
├── types.ts              # TypeScript 类型定义
└── README.md             # 文档
```

## 自定义 Hooks

### useDebounce

防抖 hook，用于延迟触发翻译请求。

```tsx
import { useDebounce } from '@/hooks/useDebounce';

const debouncedValue = useDebounce(value, 800);
```

### useLocalStorage

本地存储 hook，用于持久化语言偏好。

```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

const [value, setValue] = useLocalStorage('key', initialValue);
```

## 性能优化

- ✅ 使用 `React.memo` 优化组件渲染
- ✅ 使用 `useCallback` 缓存事件处理函数
- ✅ 使用 `useDebounce` 减少 API 调用
- ✅ 使用 `AbortController` 取消待处理请求

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器

## 开发指南

### 本地开发

1. 启动后端服务器：

```bash
cd packages/doggy-nav-server
npm run dev
```

2. 启动前端开发服务器：

```bash
cd packages/doggy-nav-main
npm run dev
```

3. 访问翻译工具页面：

```
http://localhost:3001/translation
```

### 测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:e2e
```

## 故障排除

### 翻译请求失败

1. 检查后端服务器是否运行
2. 检查网络连接
3. 查看浏览器控制台错误信息
4. 检查 API 代理配置（next.config.ts）

### 语言偏好未保存

1. 检查浏览器是否允许 localStorage
2. 清除浏览器缓存后重试
3. 检查浏览器隐私设置

### 样式显示异常

1. 确保 Tailwind CSS 正确配置
2. 检查 design-system 是否正确导入
3. 清除浏览器缓存

## 未来增强

- [ ] 语音输入支持
- [ ] 翻译历史记录
- [ ] 收藏常用翻译
- [ ] 批量翻译
- [ ] 自动语言检测
- [ ] 多翻译引擎支持
- [ ] 离线模式

## 许可证

MIT
