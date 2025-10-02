import { createApiHandler } from '../_apiHandler';

export default createApiHandler({
  method: 'GET',
  endpoint: '/api/nav',
  paramNames: ['categoryId', 'page', 'limit', 'keyword']
});