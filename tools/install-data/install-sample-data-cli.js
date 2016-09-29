#! /usr/bin/env node

/* eslint-disable */
var shell = require('shelljs'),
    path = require('path'),
    srcPath = path.resolve(process.cwd(), 'node_modules/tonic-arctic-sample-data/data'),
    destPath = path.resolve(process.cwd(), 'documentation/build-tmp/public');

shell.mkdir('-p', destPath);
shell.cp('-rf', srcPath, destPath);
