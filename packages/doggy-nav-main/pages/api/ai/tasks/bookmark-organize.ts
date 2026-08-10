import { createApiHandler } from '@/lib/apiHandler';

export default createApiHandler({
  method: 'POST',
  endpoint: '/api/ai/tasks/bookmark-organize',
});
