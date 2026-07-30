import { createApiHandler } from '../../../../lib/apiHandler';

export default createApiHandler({
  method: ['GET', 'POST'],
  endpoint: '/api/user/passkeys',
});
