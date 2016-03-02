title: Setup
---
This documentation will explain how to create a new Web project that can leverage ParaViewWeb.

``` bash
$ mkdir MyWebProject
$ cd MyWebProject
$ npm init
$ npm install paraviewweb  --save
$ npm install kw-web-suite --save-dev
```

### Webpack config

``` js webpack.config.js
var path = require('path'),
    webpack = require('webpack'),
    loaders = require('./node_modules/paraviewweb/config/webpack.loaders.js'),
    plugins = [];

if(process.env.NODE_ENV === 'production') {
    console.log('==> Production build');
    plugins.push(new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify("production"),
        },
    }));
}

module.exports = {
  plugins: plugins,
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'MyWebApp.js',
  },
  module: {
        preLoaders: [{
            test: /\.js$/,
            loader: "eslint-loader",
            exclude: /node_modules/,
        }],
        loaders: [
            { test: require.resolve("./src/index.js"), loader: "expose?MyWebApp" },
        ].concat(loaders),
    },
    resolve: {
        alias: {
            PVWStyle: path.resolve('./node_modules/paraviewweb/style'),
        },
    },
    postcss: [
        require('autoprefixer')({ browsers: ['last 2 versions'] }),
    ],
    eslint: {
        configFile: '.eslintrc',
    },
};

```

### package.json

You should extend the generated **package.json** file with the following set of scripts.

``` json package.json
{
  [...]
  "scripts": {
    "build": "fix-autobahn && webpack",
    "build:debug": "fix-autobahn && webpack --display-modules",
    "build:release": "export NODE_ENV=production && fix-autobahn && webpack -p",

    "commit": "git cz",
    "semantic-release": "semantic-release pre && npm publish && semantic-release post"
  },
}
```
