import { platform } from 'os';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import request from 'request';
import cheerio from 'cheerio';
import mongoose, { ConnectOptions } from 'mongoose';
import navModel from '../app/model/nav';
import categoryModel from '../app/model/category';
import { dateToChromeTime } from './timeUtil';
import { privateCategoryName } from '../constants';

const mongoUrl = `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`;
const getFaviconSrv = (hostname, size = 32, provider = 'faviconIm') => {
  return {
    faviconIm: `https://favicon.im/zh/${hostname}`,
    faviconIowen: `https://api.iowen.cn/favicon/${hostname}.png`,
    google: `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`,
  }[provider] ?? '/default-web.png';
};

const db = mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true } as ConnectOptions) as any;
db.mongoose = mongoose;
// 引入数据模型模块
const navData = navModel(db);
const categorySchema = categoryModel(db);
const map = new Map();

function isAbsoluteUrl(url) {
  return url.startsWith('http') || url.startsWith('//') || url.startsWith('data:image');
}

async function getBookmarkRoots(path) {
  return new Promise(resolve => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data));
    });
  });
}

async function getLogo(url) {
  const { origin, hostname } = new URL(url);
  if (map.has(origin)) {
    return map.get(origin);
  }
  return new Promise(resolve => {
    request(origin, { timeout: 10000 }, (error, requestData, body) => {
      if (!error && requestData.statusCode === 200) {
        const $ = cheerio.load(body);
        let logo = '';
        let final = '';
        if ($('link[rel="icon"]').length) {
          logo = $('link[rel="icon"]').eq(0).attr('href');
        } else if ($('link[rel*="shortcut"]').length) {
          logo = $('link[rel*="shortcut"]').eq(0).attr('href');
        } else if ($('link[rel*="-icon"]').length) {
          logo = $('link[rel*="-icon"]').eq(0).attr('href');
        }
        console.log('logo,', origin, logo);
        if (!logo) {
          final = getFaviconSrv(hostname);
        } else {
          final = logo;
          if (!isAbsoluteUrl(logo)) {
            final = logo.startsWith('/') ? `${origin}${logo}` : `${origin}/${logo}`;
          }
        }
        map.set(origin, final);
        resolve(final);
      } else {
        console.error(`获取${url} 站点logo icon失败,error= ${error}`);
        map.set(origin, getFaviconSrv(hostname));
        resolve(getFaviconSrv(hostname));
      }
    });
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sleep(ms) {
  return new Promise(r => {
    setTimeout(() => {
      r(null);
    }, ms);
  });
}

async function recursive(children, parentId) {
  for (let index = 0; index < children.length; index++) {
    const el = children[index];
    if (el.type === 'folder') {
      const firstName = el.name;
      const [ f ] = await categorySchema.find({
        name: { $eq: firstName },
        categoryId: { $eq: parentId },
      });
      let secondCategoryId = '';
      if (f && f._id) {
        secondCategoryId = f._id;
      } else {
        const { _id } = await categorySchema.create({
          categoryId: parentId,
          name: firstName,
          createAt: el.date_added ? el.date_added : dateToChromeTime(new Date()),
        });
        secondCategoryId = _id;
      }
      await recursive(el.children, secondCategoryId);
    } else if (el.type === 'url') {
      const { name, url: href } = el;
      await navData.create({
        categoryId: parentId,
        name,
        href,
        desc: name,
        createTime: el.date_added,
        hide: false,
        logo: await getLogo(href),
      });
    }
  }
}

async function transform(roots) {
  const categoryData = {
    name: privateCategoryName,
    categoryId: '',
  };
  const categoryDataRes = await categorySchema.create(categoryData);
  const firstStage = roots.bookmark_bar.children;
  await recursive(firstStage, categoryDataRes._id);
}

const handle = async (...args) => {
  const arg2 = args[2];
  try {
    if (arg2 === 'help' || arg2 === '--help' || arg2 === '-h') {
      console.info('try start with 【 HOME=${HOME} npx ts-node bookmarkHelper.ts 】');
      return;
    }
    if (arg2 === '-file' && args[3]) {
      const p = path.resolve(args[3]);
      console.info('import bookmarks from:', p);
      const bookmarks = await getBookmarkRoots(p) as any;
      await transform(bookmarks?.roots ?? { bookmark_bar: { children: [] } });
      console.info('import bookmarks done ✅✅✅✅');
      return;
    }
    if (!process.env.HOME) {
      console.info('try start with 【 HOME=${HOME} npx ts-node bookmarkHelper.ts 】or 【 npx ts-node bookmarkHelper.ts -file /path/to/your/bookmark/file 】');
      return;
    }
    console.info('import bookmarks from mac chrome default path');
    const platformStr = platform();
    let bookmarkPath = '';
    if (platformStr === 'darwin') {
      bookmarkPath = `${process.env.HOME}/Library/Application\ Support/Google/Chrome/Default/Bookmarks`;
    } else if (platformStr === 'win32') {
      bookmarkPath = `${process.env.HOME}/AppData/Local/Google/Chrome/User\ Data/Default/Bookmarks`;
    } else {
      throw new Error('current platform not supported!');
    }
    const p = path.resolve(bookmarkPath);
    console.info('import bookmarks from:', p);
    const bookmarks = await getBookmarkRoots(p) as any;
    await transform(bookmarks?.roots ?? { bookmark_bar: { children: [] } });
    console.info('import bookmarks done ✅✅✅✅');

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.info('🔌 Database connection closed.');
    process.exit(0);
  }
};

handle(process.argv);

