var prettierConf = require('./prettier.config.js');

module.exports = {
  extends: ['airbnb', 'prettier'],
  rules: {
    'prettier/prettier': ['error', prettierConf],

    // But we want the following
    'no-multi-spaces': ["error", { exceptions: { "ImportDeclaration": true } }],
    'no-param-reassign': ["error", { props: false }],
    'no-unused-vars': ["error", { args: 'none' }],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: { array: false, object: true },
        AssignmentExpression: { array: false, object: false } },
      { enforceForRenamedProperties: false }
    ],
    'import/no-extraneous-dependencies': 0, // Needed for tests
    // 'no-mixed-operators': 'error', // Wish we can put it back with prettier

    // Not for us
    'jsx-a11y/label-has-for': 0,
    'no-console': 0,
    'no-plusplus': 0,
    'import/no-named-as-default': 0,
    'import/no-named-as-default-member': 0,
    'prefer-destructuring': 0, // Can have unwanted side effect
    'react/jsx-filename-extension': 0,
    'jsx-a11y/no-static-element-interactions': 0,
    'jsx-a11y/click-events-have-key-events': 0,
    'jsx-a11y/no-noninteractive-element-interactions': 0,

    // Introduced with new eslint
    // and no time to fix them...
    // [...]
    'linebreak-style': 0,
    'no-useless-escape': 0,
    'no-nested-ternary': 0,
    'react/forbid-prop-types': 0,
    'react/no-array-index-key': 0,

    // When updating to kw-web-suite 8.0.0, we have more lint issues
    // and no time to fix
    'react/destructuring-assignment': 0,
    'react/no-access-state-in-setstate': 0,
    'react/jsx-one-expression-per-line': 0, // creates a conflict with prettier
    'jsx-a11y/label-has-associated-control': 0,
    'no-else-return': 0,
    'import/no-cycle': 0,
    'react/jsx-wrap-multilines': 0,

    // when updating to kw-web-suite 11.1.0, we have more lint issues
    // and no time to fix
    'prefer-object-spread': 0,
    'no-redeclare': 0,
    'func-names': 0,
    'react/no-render-return-value': 0,
    'react/jsx-props-no-spreading': 0,
    'babel/new-cap': 0,
    'react/no-deprecated': 0,
    'react/sort-comp': 0,
    'jsx-a11y/control-has-associated-label': 0,
    'react/jsx-curly-newline': 0,
    'no-useless-rename': 0,
  },
  plugins: [
    'prettier'
  ],
  globals: {
    __BASE_PATH__: false,
    VRFrameData: true,
  },
  'settings': {
    'import/resolver': 'webpack'
  },
  env: {
    es6: true,
    browser: true,
  },
};
