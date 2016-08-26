var path = require('path');
var webpack = require('webpack');
var loaders = require('./config/webpack.loaders.js');
var pluginList = [];

if (process.env.NODE_ENV === 'production') {
  console.log('==> Production build');
  pluginList.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }));
}

module.exports = {
  plugins: pluginList,
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'ParaViewWeb.js',
  },
  module: {
    noParse: [
      /plotly\.js/
    ],
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: [
      { test: require.resolve('./src/index.js'), loader: 'expose?ParaViewWeb' },
    ].concat(loaders),
  },
  resolve: {
    alias: {
      PVWStyle: path.resolve('./style'),
    },
  },
  postcss: [
    require('autoprefixer')({ browsers: ['last 2 versions'] }),
  ],
  eslint: {
    configFile: '.eslintrc.js',
  },
};
