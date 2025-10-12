import { createApiHandler } from '../../../../lib/apiHandler';

export default createApiHandler({
  method: 'POST',
  buildUrl: (req) => `/api/nav/${req.query.navId}/view`,
});
