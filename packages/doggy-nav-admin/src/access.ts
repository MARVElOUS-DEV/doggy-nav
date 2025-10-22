// Access control based on RBAC info returned from server
export default function access(initialState: { currentUser?: any } = {}) {
  const { currentUser } = initialState || {};
  const roles: string[] = currentUser?.roles || [];
  const isSysadmin = roles.includes('sysadmin');
  const isAdmin = isSysadmin || roles.includes('admin');
  return { isAdmin, isSysadmin } as const;
}
