import { createApiHandler } from '../_apiHandler';

export default createApiHandler({
  method: 'GET',
  endpoint: '/api/nav',
  paramName: 'keyword'
});