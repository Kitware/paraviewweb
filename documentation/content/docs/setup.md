title: Setup
---
Welcome to the ParaViewWeb documentation. If you encounter any problems when using ParaViewWeb, have a look at the  [troubleshooting guide](troubleshooting.html), raise an issue on [GitHub](https://github.com/kitware/paraviewweb/issues) or start a topic on the [Mailing list](http://www.paraview.org/mailman/listinfo/paraview).

## What is ParaViewWeb?

ParaViewWeb is a Web framework that can leverage ParaView and VTK to build interactive application
inside your Web browser.

## Installation

It only takes few minutes to set up ParaViewWeb. If you encounter a problem and can't find the solution here, please [submit a GitHub issue](https://github.com/kitware/paraviewweb/issues) and I'll try to solve it.

### Requirements

Installing ParaViewWeb as a dependency inside your Web project is quite easy. However, you do need to have a couple of other things installed first:

- [Node.js](http://nodejs.org/)
- [Git](http://git-scm.com/)

If your computer already has these, congratulations! Just install ParaViewWeb with npm:

``` bash
$ npm install paraviewweb --save
```

If not, please follow the following instructions to install all the requirements.

{% note warn For Mac users %}
You may encounter some problems when compiling. Please install Xcode from App Store first. After Xcode is installed, open Xcode and go to **Preferences -> Download -> Command Line Tools -> Install** to install command line tools.
{% endnote %}

### Install Git

- Windows: Download & install [git](https://git-scm.com/download/win).
- Mac: Install it with [Homebrew](http://mxcl.github.com/homebrew/), [MacPorts](http://www.macports.org/) or [installer](http://sourceforge.net/projects/git-osx-installer/).
- Linux (Ubuntu, Debian): `sudo apt-get install git-core`
- Linux (Fedora, Red Hat, CentOS): `sudo yum install git-core`

### Install Node.js

The best way to install Node.js is with [nvm](https://github.com/creationix/nvm).

cURL:

``` bash
$ curl https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Wget:

``` bash
$ wget -qO- https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Once nvm is installed, restart the terminal and run the following command to install Node.js.

``` bash
$ nvm install 4
```

Alternatively, download and run [the installer](http://nodejs.org/).

### Install ParaViewWeb

Once all the requirements are installed, you can install Hexo with npm.

``` bash
$ npm install paraviewweb --save
```

### Getting ParaViewWeb source code for contributing

``` bash
$ git clone https://github.com/kitware/paraviewweb.git
$ cd paraviewweb
$ npm install
```

This documentation will explain how to create a new Web project that can leverage ParaViewWeb.

``` bash
$ mkdir MyWebProject
$ cd MyWebProject
$ npm init
$ npm install paraviewweb  --save
$ npm install kw-web-suite --save-dev
```

## Creating your own project

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
