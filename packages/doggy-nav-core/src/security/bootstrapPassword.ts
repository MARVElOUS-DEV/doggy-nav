export function requireBootstrapPassword(password?: string): string {
  if (
    !password ||
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      'Configure an administrator password with at least 12 characters, uppercase, lowercase and a number'
    );
  }
  return password;
}
