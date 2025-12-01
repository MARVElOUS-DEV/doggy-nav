import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

// Mimic a real browser to avoid basic WAF blocking
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

export const getFaviconSrv = (hostname, size = 32, provider = 'faviconIm') => {
  return (
    {
      faviconIm: `https://favicon.im/zh/${hostname}`,
      faviconIowen: `https://api.iowen.cn/favicon/${hostname}.png`,
      google: `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`,
    }[provider] ?? '/default-web.png'
  );
};

export function isAbsoluteUrl(url) {
  return url.startsWith('http') || url.startsWith('//') || url.startsWith('data:image');
}

export async function parseHTML(url) {
  let targetUrl = url;
  if (!url.startsWith('http')) {
    targetUrl = `http://${url}`;
  }

  try {
    const { origin, hostname } = new URL(targetUrl);

    const response = await axios.get(targetUrl, {
      timeout: 10000, // Increased timeout
      headers: BROWSER_HEADERS,
      maxRedirects: 5,
      validateStatus: (status) => status < 400, // Resolve only for 2xx/3xx
    });

    const body = response.data;

    if (body) {
      const $ = cheerio.load(body);
      const name = $('title').text().trim() || hostname;
      const desc =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        `试试 ${targetUrl} 吧`;

      let logo = '';
      let final = '';

      // Enhanced icon detection
      if ($('link[rel="apple-touch-icon"]').length) {
        logo = $('link[rel="apple-touch-icon"]').eq(0).attr('href');
      } else if ($('link[rel="icon"]').length) {
        logo = $('link[rel="icon"]').eq(0).attr('href');
      } else if ($('link[rel*="shortcut"]').length) {
        logo = $('link[rel*="shortcut"]').eq(0).attr('href');
      } else if ($('link[rel*="-icon"]').length) {
        logo = $('link[rel*="-icon"]').eq(0).attr('href');
      }

      if (!logo) {
        final = getFaviconSrv(hostname);
      } else {
        final = logo;
        if (!isAbsoluteUrl(logo)) {
          // Handle relative URLs properly
          if (logo.startsWith('//')) {
            final = `https:${logo}`;
          } else {
            final = logo.startsWith('/') ? `${origin}${logo}` : `${origin}/${logo}`;
          }
        }
      }

      return {
        name,
        href: targetUrl,
        desc,
        logo: final,
      };
    }
  } catch (error) {
    console.error(`Failed to scrape ${targetUrl}: ${error.message}`);
    // Try to return at least the favicon service result if scraping fails
    try {
      const { hostname } = new URL(targetUrl);
      return {
        name: hostname,
        href: targetUrl,
        desc: '无法获取站点描述',
        logo: getFaviconSrv(hostname),
      };
    } catch {
      return null;
    }
  }
  return null;
}
export async function sleep(ms) {
  return new Promise((r) => {
    setTimeout(() => {
      r(null);
    }, ms);
  });
}
