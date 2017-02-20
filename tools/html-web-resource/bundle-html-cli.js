#! /usr/bin/env node

/* eslint-disable */
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');

if (process.argv.length !== 3) {
  console.log('Expect path to html file as argument');
  process.exit();
}

var inputHtmlFile = process.argv[2];
var array = inputHtmlFile.split('.');
array[array.length - 2] = `${array[array.length - 2]}-width-html-data`;
var newOutputFile = array.join('.');
var baseDir = path.dirname(inputHtmlFile);

console.log('Base directory', baseDir);
console.log('Generate', newOutputFile, 'from', inputHtmlFile);

function isBinary(name) {
  if (name.endsWith('.jpg')) {
    return true;
  }
  return false;
}

var webResources = ['<style>.webResource { display: none; }</style>'];

shell.cd(baseDir);
shell.find('data').filter(function(f) { return !f.endsWith('.DS_Store'); }).forEach(function(name) {
  var fullPath = path.join(baseDir, name);
  if (fs.statSync(fullPath).isFile()) {
    console.log('   -', name);
    var webResource = [`<div class="webResource" data-url="${name}">`, null, '</div>'];
    if (isBinary(name)) {
      webResource[1] = fs.readFileSync(fullPath, { flag: 'r' }).toString('base64');
    } else {
      webResource[1] = fs.readFileSync(fullPath, { encoding: 'utf8', flag: 'r' });
    }
    webResources.push(webResource.join(''));
  }
});


var htmlTemplate = fs.readFileSync(inputHtmlFile, { encoding: 'utf8', flag: 'r' });
var lines = htmlTemplate.split('\n');
var count = lines.length;
webResources.push('<script>ready()</script>');
webResources.push('</body>');
while (count--) {
  if (lines[count].indexOf('</body>') !== -1) {
    lines[count] = webResources.join('\n');
  }
}

shell.ShellString(lines.join('\n')).to(newOutputFile);
