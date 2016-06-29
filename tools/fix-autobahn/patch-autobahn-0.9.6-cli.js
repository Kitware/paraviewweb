#! /usr/bin/env node

// sed -i.bak 's/WAMP_FEATURES = {/var WAMP_FEATURES = {/' ./node_modules/autobahn/lib/session.js
// && sed -i.bak 's/var var WAMP_FEATURES = {/var WAMP_FEATURES = {/' ./node_modules/autobahn/lib/session.js
// && rm ./node_modules/autobahn/lib/session.js.bak

/* eslint-disable */
var shell = require('shelljs'),
    path = require('path'),
    searchPath = path.resolve(process.cwd(), 'node_modules');

shell
  .find(searchPath)
  .filter(function(file) {
      return file.match(/autobahn\/lib\/session.js$/);
  })
  .forEach(function(file) {
    shell.sed('-i', 'WAMP_FEATURES = {', 'var WAMP_FEATURES = {', file);
    shell.sed('-i', 'var var WAMP_FEATURES = {', 'var WAMP_FEATURES = {', file);
  });
