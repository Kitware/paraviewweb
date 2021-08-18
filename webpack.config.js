const path = require('path');

const linterRules = require('./config/wp5/rules-linter.js');
const pvwRules = require('./config/wp5/rules-pvw.js');
const vtkRules = require('./config/wp5/rules-vtk.js');
const wslinkRules = require('./config/wp5/rules-wslink.js');

const entry = path.join(__dirname, './src/index.js');
const outputPath = path.join(__dirname, './dist');
const styles = path.join(__dirname, './style');

const plugins = [];

module.exports = {
  plugins,
  entry,
  output: {
    path: outputPath,
    filename: 'ParaViewWeb.js',
    libraryTarget: 'umd',
  },
  module: {
    noParse: [/plotly\.js/],
    rules: [{
      test: entry,
      loader: 'expose-loader',
      options: {
        exposes: ['ParaViewWeb'],
      }
    }].concat(
      pvwRules,
      linterRules,
      vtkRules,
      wslinkRules
    ),
  },
  resolve: {
    alias: {
      paraviewweb: __dirname,
      PVWStyle: styles,
    },
    fallback: { stream: require.resolve('stream-browserify') },
  },
};
