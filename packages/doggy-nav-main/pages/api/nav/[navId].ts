import { createApiHandler } from '../../../lib/apiHandler';

export default createApiHandler({
  method: 'PUT',
  endpoint: '/api/nav',
  paramName: 'navId'
});