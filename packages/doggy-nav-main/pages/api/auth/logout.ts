import { createApiHandler } from '../../../lib/apiHandler';

export default createApiHandler({
  method: 'POST',
  endpoint: '/api/auth/logout'
});