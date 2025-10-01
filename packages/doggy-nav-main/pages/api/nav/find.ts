import { createApiHandler } from '../_apiHandler';

export default createApiHandler({
  method: 'GET',
  endpoint: '/api/nav/find',
  paramName: 'categoryId'
});