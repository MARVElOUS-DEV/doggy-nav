import { platform } from 'os';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import navModel from '../app/model/nav';
import categoryModel from '../app/model/category';
import { dateToChromeTime } from 'doggy-nav-core';
import { globalRootCategoryId, privateCategoryName } from '../constants';
import mongoCfg from '../config/mongodb';
import { getFaviconSrv, parseHTML } from './reptileHelper';

const map = new Map();
let categorySchema;
// 引入数据模型模块
let navData;
async function getBookmarkRoots(path) {
  return new Promise(resolve => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data));
    });
  });
}

async function getLogo(url) {
  try {
    const { origin, hostname } = new URL(url);
    if (map.has(origin)) {
      return map.get(origin);
    }
    
    const result = await parseHTML(url);
    let final = '';

    if (result && result.logo) {
      final = result.logo;
      console.log('logo,', origin, final);
    } else {
      console.error(`获取${url} 站点logo icon失败, result is null`);
      final = getFaviconSrv(hostname);
    }

    map.set(origin, final);
    return final;
  } catch (e) {
    console.error(`Error processing logo for ${url}: ${e}`);
    try {
      const { origin, hostname } = new URL(url);
      const fallback = getFaviconSrv(hostname);
      map.set(origin, fallback);
      return fallback;
    } catch {
      return '/default-web.png';
    }
  }
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
          createAt: el.date_added ?? dateToChromeTime(new Date()),
          icon: '',
          description: '',
          audience: { visibility: 'hide', allowRoles: [], allowGroups: [] },
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
        audience: { visibility: 'hide', allowRoles: [], allowGroups: [] },
        logo: await getLogo(href),
      });
    }
  }
}

async function transform(roots) {
  const categoryData = {
    name: privateCategoryName,
    categoryId: globalRootCategoryId,
    icon: 'type:emoji_🐶',
    createAt: dateToChromeTime(new Date()),
    showInMenu: true,
    description: 'private bookmarks',
    audience: { visibility: 'hide', allowRoles: [], allowGroups: [] },
  };
  const categoryDataRes = await categorySchema.create(categoryData);
  const firstStage = roots.bookmark_bar.children;
  await recursive(firstStage, categoryDataRes._id);
}

const handle = async (...args) => {
  const mongoUrl = mongoCfg.mongoUrl;
  const db = await mongoose.connect(mongoUrl) as any;
  db.mongoose = mongoose;
  categorySchema = categoryModel(db);
  navData = navModel(db);
  const arg2 = args[2];
  try {
    if (arg2 === 'help' || arg2 === '--help' || arg2 === '-h') {
      console.info('try start with 【 HOME=${HOME} npx ts-node bookmarkHelper.ts [-file] [filepath]】');
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
    const platformStr = platform();
    let bookmarkPath = '';
    if (platformStr === 'darwin') {
      console.info('import bookmarks from mac chrome default path');
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

handle(...process.argv);

