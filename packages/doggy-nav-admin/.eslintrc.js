module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  rule: [
    'noImplicitAny'
  ],
  globals: {
    ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION: true,
    page: true,
    REACT_APP_ENV: true,
  },
};
