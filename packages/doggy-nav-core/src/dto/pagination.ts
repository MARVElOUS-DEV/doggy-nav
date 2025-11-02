export interface PageQuery {
  pageSize?: number;
  pageNumber?: number;
}

export interface PageResult<T> {
  data: T[];
  total: number;
  pageNumber: number; // total pages
}
