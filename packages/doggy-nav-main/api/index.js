
import axios from '@/plugins/axios';

function objToQuery(obj) {
  if (!obj) return ''

  const query = `?`
  const queryArr = []
  for (let i in obj) {
    queryArr.push(`${i}=${obj[i]}`)
  }

  return query + queryArr.join('&')
}

export const API_NAV = '/api/nav'
export const API_NAV_REPTILE = '/api/nav/reptile'
export const API_NAV_RANDOM = '/api/nav/random'
export const API_NAV_RANKING = '/api/nav/ranking'
export const API_NAV_FIND = '/api/nav/find'
export const API_CATEGORY_LIST = '/api/category/list'
export const API_TAG_LIST = '/api/tag/list'

const api = {
  addNav(data) {
    return axios.post('/api/nav', data)
  },
  editNav(data) {
    return axios.put('/api/nav', data)
  },
  findNav(id) {
    return axios.get(`/api/nav/find?categoryId=${id}`)
  },
  getCategoryList() {
    return axios.get('/api/category/list')
  //   return Promise.resolve({data:[
  //     {
  //       "icon": "",
  //       "showInMenu": true,
  //       "_id": "624ea8ce3d1b9129c01fa9c0",
  //       "name": "设计",
  //       "categoryId": "",
  //       "children": [
  //         {
  //           "icon": "",
  //           "showInMenu": true,
  //           "_id": "624ea8d23d1b9129c01faa0c",
  //           "categoryId": "624ea8ce3d1b9129c01fa9c0",
  //           "name": "热门推荐",
  //           "children": [
  //             {
  //               "icon": "",
  //               "showInMenu": true,
  //               "_id": "624ea8d13d1b9129c01fa9cc",
  //               "categoryId": "624ea8d23d1b9129c01faa0c",
  //               "name": "域名注册",
  //               "children": [],
  //               "__v": 0
  //             }
  //           ],
  //           "__v": 0
  //         }
  //       ],
  //       "__v": 0
  //     }
  // ]})
  },
}

export default api
