module.exports = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
    ],
  },
  {
    test: /\.c$/i,
    exclude: /node_modules/,
    loader: 'shader-loader',
  },
  {
    test: /\.mcss$/,
    use: [
      { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          modules: {
            localIdentName: '[name]-[local]_[sha512:hash:base32:5]',
          },
        },
      },
      {
        loader: 'postcss-loader',
      },
    ],
  },
  {
    test: /\.html$/,
    loader: 'html-loader',
  },
  {
    test: /\.isvg$/,
    loader: 'html-loader',
    options: {
      attrs: false, // ?attrs=false
      sources: false, // ^ Replacemet?
    }
  },
  {
    test: /\.svg$/,
    loader: 'svg-sprite-loader',
    exclude: /fonts/,
    options: {
      runtimeCompat: true,
    },
  },
  {
    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader',
    options: {
      limit: 60000,
      mimetype: 'application/font-woff',
    },
  },
  {
    test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader',
    include: /fonts/,
    options: {
      limit: 60000,
    },
  },
  {
    test: /\.(png|jpg)$/,
    loader: 'url-loader',
    options: {
      limit: 8192,
    },
  },
  {
    test: /\.css$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      {
        loader: 'postcss-loader',
      },
    ],
  },
];
