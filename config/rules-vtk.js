module.exports = [
  {
    test: /\.glsl$/i,
    include: /node_modules(\/|\\)vtk.js(\/|\\)/,
    loader: 'shader-loader',
  },
  {
    test: /\.js$/,
    include: /node_modules(\/|\\)vtk.js(\/|\\)/,
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
