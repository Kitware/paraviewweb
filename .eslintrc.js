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
    // 'no-restricted-syntax': 1,
    'import/no-extraneous-dependencies': 0, // Force dependency instead of devDep
    'import/no-named-as-default-member': 0,
    'no-mixed-operators': 0,
    'object-property-newline': 0,
    'prefer-spread': 0,
    'react/jsx-filename-extension': 0,
    'react/self-closing-comp': 0,
    'react/no-string-refs': 0,
    'jsx-a11y/label-has-for': 0,
    'react/no-find-dom-node': 0,
    'operator-assignment': 0,
    'react/jsx-curly-spacing': 0,
  },
  'settings': {
    'import/resolver': 'webpack'
  }
};
