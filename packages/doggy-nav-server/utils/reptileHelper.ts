import request from 'request';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export const getFaviconSrv = (hostname, size = 32, provider = 'faviconIm') => {
  return {
    faviconIm: `https://favicon.im/zh/${hostname}`,
    faviconIowen: `https://api.iowen.cn/favicon/${hostname}.png`,
    google: `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`,
  }[provider] ?? '/default-web.png';
};

export function isAbsoluteUrl(url) {
  return url.startsWith('http') || url.startsWith('//') || url.startsWith('data:image');
}

export async function parseHTML(url) {
  const { origin, hostname } = new URL(url);
  return new Promise(resolve => {
    request(origin, { timeout: 6000, followAllRedirects: true }, (error, responseData, body) => {
      if (!error && responseData.statusCode === 200) {
        const $ = cheerio.load(body);
        const name = $('title').text();
        const desc = $('meta[name="description"]').attr('content');
        let logo = '';
        let final = '';
        if ($('link[rel="icon"]').length) {
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
            final = logo.startsWith('/') ? `${origin}${logo}` : `${origin}/${logo}`;
          }
        }
        resolve({
          name,
          href: url,
          desc,
          logo: final,
        });
      } else {
        console.error(`获取${url} 站点logo icon失败,error= ${error}`);
        resolve(null);
      }
    });
  });
}
export async function sleep(ms) {
  return new Promise(r => {
    setTimeout(() => {
      r(null);
    }, ms);
  });
}

