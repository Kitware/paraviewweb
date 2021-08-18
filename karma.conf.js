/* eslint-disable global-require */
/* eslint-disable react/require-extension */
const path = require('path');
const webpack = require('webpack');

const pvwRules = require('./config/wp5/rules-pvw.js');
const vtkRules = require('./config/wp5/rules-vtk.js');
const wslinkRules = require('./config/wp5/rules-wslink.js');

const sourcePath = path.join(__dirname, './src');

var styles = path.join(__dirname, './style');

module.exports = function karmaConf(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-tap'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-tap-pretty-reporter'),
    ],
    basePath: '',
    frameworks: ['tap', 'webpack'],
    files: [
      './src/**/tests/*.js',
      { pattern: 'data/**', watched: false, included: false, served: true },
      {
        pattern: 'node_modules/tonic-arctic-sample-data/data/**',
        watched: false,
        included: false,
        served: true,
      },
    ],
    exclude: ['src/tests/**/*-node-only.js'],
    proxies: {
      '/data/': [
        'http://localhost:',
        9876,
        '/base/node_modules/tonic-arctic-sample-data/data/',
      ].join(''),
    },
    preprocessors: {
      'src/**/tests/*.js': ['webpack'],
    },

    webpack: {
      mode: 'development',
      module: {
        rules: [].concat(pvwRules, vtkRules, wslinkRules),
      },
      resolve: {
        modules: [path.resolve(__dirname, 'node_modules'), sourcePath],
        alias: {
          paraviewweb: __dirname,
          PVWStyle: styles,
          stream: 'stream-browserify',
          buffer: 'buffer',
        },
        fallback: {
          path: false,
          fs: false,
        },
      },
      plugins: [
        new webpack.ProvidePlugin({ process: ['process/browser'] }),
      ],
    },

    webpackMiddleware: {
      noInfo: true,
    },

    reporters: ['coverage', 'tap-pretty'],

    tapReporter: {
      // outputFile: 'Documentation/content/coverage/tests.md',
      prettifier: 'tap-spec',
      separator:
        '\n=========================================================\n=========================================================\n',
    },

    coverageReporter: {
      dir: 'documentation/build-tmp/public',
      reporters: [{ type: 'html', subdir: 'coverage' }],
    },

    client: {
      useIframe: false,
    },

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--ignore-gpu-blacklist'],
      },
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
