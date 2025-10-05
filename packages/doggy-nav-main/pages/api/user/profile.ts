import { createApiHandler } from '../../../lib/apiHandler';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500kb',
    },
  },
}

export default createApiHandler({
  method: 'PUT',
  endpoint: '/api/user/profile'
});
