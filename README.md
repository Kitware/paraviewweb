## [ParaViewWeb](http://kitware.github.io/ParaViewWeb/)

[![Build Status](https://travis-ci.org/Kitware/paraviewweb.svg)](https://travis-ci.org/Kitware/paraviewweb)
[![Dependency Status](https://david-dm.org/kitware/paraviewweb.svg)](https://david-dm.org/kitware/paraviewweb)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/paraviewweb.svg)
![npm-version-requirement](https://img.shields.io/badge/npm->=3.0.0-brightgreen.svg)
![node-version-requirement](https://img.shields.io/badge/node->=5.0.0-brightgreen.svg)

### Introduction

ParaViewWeb aims to provide a framework for building interactive
web visualizations which rely on VTK or ParaView to produce visualization data.

This data can be static or dynamic ranging from a no-server setup to
having a ParaView or VTK backend sending either geometry or images to the client.

## Documentation

See the [documentation](https://kitware.github.io/paraviewweb) for a
getting started guide, advanced documentation, and API descriptions.

## Development

You can start building the ParaViewWeb library by itself with the following
set of commands:

```js
$ git clone https://github.com/kitware/paraviewweb.git
$ cd paraviewweb
$ npm run install:global
$ npm install
$ npm run build
```

### Licensing

**ParaViewWeb** is licensed under the [BSD 3-Clause License](LICENSE).

### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **ParaViewWeb** useful to as many people as possible.
