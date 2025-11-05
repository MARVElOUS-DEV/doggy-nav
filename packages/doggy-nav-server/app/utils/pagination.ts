export type PageQuery = { pageSize?: any; pageNumber?: any };

export function normalizePage(q: PageQuery, max = 200) {
  const pageSize = Math.min(Math.max(Number(q.pageSize) || 10, 1), max);
  const pageNumber = Math.max(Number(q.pageNumber) || 1, 1);
  const skip = pageSize * pageNumber - pageSize;
  return { pageSize, pageNumber, skip };
}

export function toPageEnvelope(total: number, pageSize: number) {
  return { total, pageNumber: Math.ceil(total / Math.max(pageSize, 1)) };
}
