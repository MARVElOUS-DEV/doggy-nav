import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      "recommend_site": "Recommend a site",
      "update_log": "Update Log",
      "customer_service": "Customer Service",
      "add_site": "Add Site",
      "back_to_top": "Back to Top",
      "latest": "Latest",
      "most_clicks": "Most Clicks",
      "most_likes": "Most Likes",
      "switch_to_dark_mode": "Switch to dark mode",
      "switch_to_light_mode": "Switch to light mode"
    }
  },
  zh: {
    translation: {
      "recommend_site": "推荐网站",
      "update_log": "更新日志",
      "customer_service": "联系客服",
      "add_site": "添加网站",
      "back_to_top": "返回顶部",
      "latest": "最新导航",
      "most_clicks": "点击最多导航",
      "most_likes": "点赞最多导航",
      "switch_to_dark_mode": "切换到深色模式",
      "switch_to_light_mode": "切换到浅色模式"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // default language
    fallbackLng: 'zh',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
