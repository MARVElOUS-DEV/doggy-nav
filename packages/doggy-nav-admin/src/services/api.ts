import request from '@/utils/request';

export const API_LOGIN = '/api/login';
export const API_NAV_LIST = '/api/nav/list';
export const API_NAV = '/api/nav';
export const API_NAV_AUDIT = '/api/nav/audit';
export const API_CATEGORY_LIST = '/api/category/list';
export const API_CATEGORY = '/api/category';
export const API_TAG = '/api/tag';
export const API_TAG_list = '/api/tag/list';
export const API_INVITE_CODES = '/api/invite-codes';
export const API_INVITE_CODES_LIST = '/api/invite-codes/list';
export const API_ROLES = '/api/roles';
export const API_GROUPS = '/api/groups';
export const API_GROUP_MEMBERS = (id: string) => `/api/groups/${id}/members`;

export async function login(data: { username: string; password: string }) {
  return request({
    url: API_LOGIN,
    method: 'POST',
    data,
  });
}

export async function getNavList(data: any) {
  return request({
    url: API_NAV_LIST,
    method: 'GET',
    data,
  });
}

export async function getInviteCodes(params: any) {
  return request({
    url: API_INVITE_CODES_LIST,
    method: 'GET',
    data: params,
  });
}

export async function createInviteCodes(data: any) {
  return request({
    url: API_INVITE_CODES,
    method: 'POST',
    data,
  });
}

export async function updateInviteCode(id: string, data: any) {
  return request({
    url: `${API_INVITE_CODES}/${id}`,
    method: 'PUT',
    data,
  });
}

export async function revokeInviteCode(id: string) {
  return request({
    url: `${API_INVITE_CODES}/${id}/revoke`,
    method: 'POST',
  });
}

export async function getRoles() {
  return request({ url: API_ROLES, method: 'GET' });
}

export async function getGroups() {
  return request({ url: API_GROUPS, method: 'GET' });
}

export async function createGroup(data: any) {
  return request({
    url: API_GROUPS,
    method: 'POST',
    data,
  });
}

export async function updateGroup(id: string, data: any) {
  return request({
    url: `${API_GROUPS}/${id}`,
    method: 'PUT',
    data,
  });
}

export async function deleteGroup(ids: string[]) {
  return request({
    url: API_GROUPS,
    method: 'DELETE',
    data: { ids },
  });
}

export async function getGroupDetail(id: string) {
  return request({
    url: `${API_GROUPS}/${id}`,
    method: 'GET',
  });
}

export async function addGroupMembers(id: string, userIds: string[]) {
  return request({
    url: API_GROUP_MEMBERS(id),
    method: 'POST',
    data: { userIds },
  });
}

// bulk add removed; use addGroupMembers with selected userIds only
