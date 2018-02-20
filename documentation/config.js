const path = require('path');

const linterRules = require('../config/rules-linter.js');
const pvwRules = require('../config/rules-pvw.js');
const vtkRules = require('../config/rules-vtk.js');
const wslinkRules = require('../config/rules-wslink.js');

module.exports = {
  baseUrl: '/paraviewweb',
  work: './build-tmp',
  api: ['../src'],
  examples: ['../src'],
  config: {
    title: 'ParaViewWeb',
    description:
      '"ParaViewWeb is a Web framework which allow to bring the power of ParaView and VTK into the Web."',
    subtitle:
      '"Small framework for bringing scientific visualization to the Web"',
    author: 'Kitware Inc.',
    timezone: 'UTC',
    url: 'https://kitware.github.io/paraviewweb',
    root: '/paraviewweb/',
    github: 'kitware/paraviewweb',
    google_analytics: 'UA-90338862-2',
  },
  webpack: {
    module: {
      noParse: [/plotly\.js/],
      rules: [].concat(
        linterRules,
        pvwRules,
        vtkRules,
        wslinkRules
      ),
    },
    resolve: {
      alias: {
        paraviewweb: path.resolve('.'),
        PVWStyle: path.resolve('./style'),
      },
    },
  },
  copy: [],
};
