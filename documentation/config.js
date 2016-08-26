const vtkLoaders = require('../config/webpack.loaders.js');
const path = require('path');

module.exports = {
  baseUrl: '/paraviewweb',
  work: './build-tmp',
  api: ['../src'],
  examples: ['../src'],
  config: {
    title: 'ParaViewWeb',
    description: '"ParaViewWeb is a Web framework which allow to bring the power of ParaView and VTK into the Web."',
    subtitle: '"Small framework for bringing scientific visualization to the Web"',
    author: 'Kitware Inc.',
    timezone: 'UTC',
    url: 'https://kitware.github.io/paraviewweb',
    root: '/paraviewweb/',
    github: 'kitware/paraviewweb',
  },
  webpack: {
    module: {
      noParse: [
      /plotly\.js/
      ],
      loaders: vtkLoaders,
    },
    resolve: {
      alias: {
        PVWStyle: path.resolve('./style'),
      },
    },
    postcss: [
      require('autoprefixer')({ browsers: ['last 2 versions'] }),
    ],
  },
  copy: [],
};
