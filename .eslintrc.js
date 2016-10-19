module.exports = {
  extends: 'airbnb',
  rules: {
    'import/no-extraneous-dependencies': ["error", { "devDependencies": true }],
    'max-len': ["warn", 160, 4, {"ignoreUrls": true}],
    'no-multi-spaces': ["error", { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': ["error", { props: false }],
    'no-unused-vars': ["error", { args: 'none' }],
    'react/jsx-filename-extension': ["error", { "extensions": [".js"] }],
    'no-mixed-operators': ["error", {"allowSamePrecedence": true}],
    'no-plusplus': ["error", { "allowForLoopAfterthoughts": true }],

    // Should fix that at some point but too much work...
    'react/no-is-mounted': "warn",
    'no-var': 0,
    'one-var': 0,
    'react/prefer-es6-class': 0,
    'no-nested-ternary': 0,
    'react/forbid-prop-types': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'react/no-unused-prop-types': 0,

    // Not for us ;-)
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'import/no-named-as-default-member': 0,
  },
  'settings': {
    'import/resolver': 'webpack'
  }
};
