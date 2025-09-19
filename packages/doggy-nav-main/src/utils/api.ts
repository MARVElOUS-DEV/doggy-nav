import axios from 'axios';

export const API_NAV_RANKING = '/api/nav/ranking';
export const API_NAV = '/api/nav';
export const API_NAV_REPTILE = '/api/nav/reptile';
export const API_TAG_LIST = '/api/tag/list';
export const API_NAV_RANDOM = '/api/nav/random';

const api = {
  getCategoryList: () => axios.get('/api/category/list'),
  findNav: (id: string) => axios.get(`/api/nav/find?id=${id}`),
};

export default api;
