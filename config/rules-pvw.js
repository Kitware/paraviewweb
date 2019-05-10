const autoprefixer = require('autoprefixer');

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
          localIdentName: '[name]-[local]_[sha512:hash:base32:5]',
          modules: true,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
        },
      },
    ],
  },
  {
    test: /\.html$/,
    loader: 'html-loader',
  },
  {
    test: /\.isvg$/,
    loader: 'html-loader?attrs=false',
  },
  {
    test: /\.svg$/,
    loader: 'svg-sprite-loader?runtimeCompat=true',
    exclude: /fonts/,
  },
  {
    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader?limit=60000&mimetype=application/font-woff',
  },
  {
    test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: 'url-loader?limit=60000',
    include: /fonts/,
  },
  {
    test: /\.(png|jpg)$/,
    loader: 'url-loader?limit=8192',
  },
  {
    test: /\.css$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => [autoprefixer('last 2 version', 'ie >= 10')],
        },
      },
    ],
  },
];
