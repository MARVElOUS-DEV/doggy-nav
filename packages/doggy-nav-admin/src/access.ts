// Access control based on RBAC info returned from server
export default function access(initialState: { currentUser?: any } = {}) {
  const { currentUser } = initialState || {};
  const roles: string[] = currentUser?.roles || [];
  const isSuperadmin = roles.includes('superadmin');
  const isAdmin = isSuperadmin || roles.includes('admin');
  return { isAdmin, isSuperadmin } as const;
}
