// Shared ESLint configuration for the monorepo
export default [
  {
    // General rules for all packages
    rules: {
      // Add any shared rules here that should apply to all packages
    },
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/out/**",
      "**/coverage/**",
      "**/*.d.ts"
    ]
  }
];