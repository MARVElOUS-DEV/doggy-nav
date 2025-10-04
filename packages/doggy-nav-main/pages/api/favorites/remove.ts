import { createApiHandler } from '../../../lib/apiHandler';

export default createApiHandler({
  method: 'DELETE',
  endpoint: '/api/favorites',
  paramName: 'navId'
});