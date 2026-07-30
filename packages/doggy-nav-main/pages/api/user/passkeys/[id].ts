import { createApiHandler } from '../../../../lib/apiHandler';

export default createApiHandler({
  method: 'DELETE',
  buildUrl: (req) => `/api/user/passkeys/${encodeURIComponent(String(req.query.id))}`,
});
