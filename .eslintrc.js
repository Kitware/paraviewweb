module.exports = {
  extends: 'airbnb',
  rules: {
    'max-len': [1, 160, 4, {"ignoreUrls": true}],
    'no-console': 0,
    'no-multi-spaces': [2, { exceptions: { "ImportDeclaration": true } }],
    'no-nested-ternary': 0,
    'no-param-reassign': [2, { props: false }],
    'no-unused-vars': [2, { args: 'none' }],
    'no-var': 0,
    'one-var': 0,
    'react/no-is-mounted': 1,
    'react/prefer-es6-class': 0,
  }
};
