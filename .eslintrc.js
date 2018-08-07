module.exports = {
  extends: ['airbnb-base', 'plugin:jest/recommended', 'prettier'],
  plugins: ['jest', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
  env: {
    'jest/globals': true,
  },
};
