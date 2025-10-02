import { createApiHandler } from '../_apiHandler';

export default createApiHandler({
  method: 'GET',
  endpoint: '/api/favorites/list'
});