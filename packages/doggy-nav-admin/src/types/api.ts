export interface CategoryModel {
  id: string;
  name: string;
  parentId: string;
  children: CategoryModel[];
}

export interface TagModel {
  id: string;
  name: string;
}

export interface ApiResponse {
  code: number;
  msg: string;
  data: any;
}

export enum NavStatus {
  pass,
  wait,
  reject,
}
