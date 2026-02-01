import { createApiHandler } from '@/lib/apiHandler';

export default createApiHandler({ method: 'GET', endpoint: '/api/auth/token' });
