import { createApiHandler } from '../../../lib/apiHandler';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default createApiHandler({
  method: 'PUT',
  endpoint: '/api/user/password',
});
