interface AuthSessionResponse<TUser> {
  authenticated: boolean;
  user: TUser | null;
  accessExp: number | null;
}

export async function restoreAuthSession<TUser>(
  getCurrentUser: () => Promise<AuthSessionResponse<TUser>>,
  refresh: () => Promise<void>
) {
  const current = await getCurrentUser();
  if (current.authenticated) return current;

  try {
    await refresh();
  } catch {
    return current;
  }

  return await getCurrentUser();
}
