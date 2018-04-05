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
$ npm install normalize.css --save-dev
$ npm install monologue.js --save-dev
```

## Creating your own project

### Webpack config

``` js webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rules = require('./node_modules/paraviewweb/config/webpack.loaders.js');
const plugins = [
  new HtmlWebpackPlugin({
    inject: 'body',
  }),
];

const entry = path.join(__dirname, './src/index.js');
const outputPath = path.join(__dirname, './dist');
const styles = path.resolve('./node_modules/paraviewweb/style');

module.exports = {
  plugins,
  entry,
  output: {
    path: outputPath,
    filename: 'MyWebApp.js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
     { test: entry, loader: "expose-loader?MyWebApp" },
    ].concat(rules),
  },
  resolve: {
    alias: {
      PVWStyle: styles,
    },
  },
  devServer: {
    contentBase: './dist/',
    port: 9999,
  },
};

```

### package.json

You should extend the generated **package.json** file with the following set of scripts.

``` json package.json
{
  [...]
  "scripts": {
    "build": "webpack --mode development",
    "build:debug": "webpack --display-modules",
    "build:release": "webpack --mode production",
    "start": "webpack-dev-server",

    "commit": "git cz",
    "semantic-release": "semantic-release"
  },
}
```

### Run 

To build your application you can run `npm run build` and to test/debug it `npm start` while opening `http://localhost:9999`.
