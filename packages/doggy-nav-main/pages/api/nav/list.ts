import { createApiHandler } from '../../../lib/apiHandler';

export default createApiHandler({
  method: 'GET',
  endpoint: '/api/nav/list',
  paramNames: ['status', 'categoryId', 'name', 'pageSize', 'pageNumber']
});
