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
          presets: ['@babel/preset-env'],
          // presets: [['env', { targets: { browsers: 'last 2 versions' } }]],
        },
      },
    ],
  },
  {
    test: /\.worker\.js$/,
    include: /node_modules(\/|\\)vtk.js(\/|\\)/,
    use: [
      { loader: 'worker-loader', options: { inline: true, fallback: false } },
    ],
  },
  {
    test: /\.svg$/,
    include: /node_modules(\/|\\)vtk.js(\/|\\)/,
    use: [{ loader: 'raw-loader' }],
  },
];
