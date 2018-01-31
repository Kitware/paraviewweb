module.exports = [
  {
    test: /\.js$/,
    include: /node_modules(\/|\\)wslink(\/|\\)/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['env'],
          // presets: [['env', { targets: { browsers: 'last 2 versions' } }]],
        },
      },
    ],
  },
];
