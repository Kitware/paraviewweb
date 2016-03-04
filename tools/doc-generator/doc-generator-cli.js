#! /usr/bin/env node

/* eslint-disable */
var program = require('commander'),
    shell = require('shelljs'),
    path = require('path'),
    pkg = require('../../package.json'),
    publishBaseURL = '/' + pkg.repository.url.split('/').pop().split('.git')[0],
    version = /semantically-release/.test(pkg.version) ? 'development version' : pkg.version,
    baseUrl = "'" + publishBaseURL + "'",
    buildHelper = require('../example-build/example-builder.js'),
    examples = buildHelper.examples,
    rootWWW = path.join(process.env.PWD, 'documentation/www'),
    apiFound = [],
    exampleFound = [];

program
  .version(version)
  .option('-a, --api',                  'Generate the API documentation')
  .option('-e, --examples [names...]',  'Build examples or all if none given')
  .option('-l, --list',                 'List examples')
  .option('-p, --publish',              'Publish documentation to github.io/gh-pages')
  .option('-s, --serve',                'Serve documentation at http://localhost:3000/')
  .option('-t, --stats',                'List API / Example coverage')
  .parse(process.argv);

// ----------------------------------------------------------------------------
// Need argument otherwise print help/usage
// ----------------------------------------------------------------------------

if (!process.argv.slice(2).length) {
    return program.outputHelp();
}

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

shell.mkdir('-p', rootWWW);
shell.cd(process.env.PWD);

// ----------------------------------------------------------------------------
// Pre-publish setup (Build everything)
// ----------------------------------------------------------------------------

if(program.publish) {
    program.api = true;
    program.examples = true;
    program.args = [];
}

// ----------------------------------------------------------------------------
// Extract examples
// ----------------------------------------------------------------------------

if(program.list || program.examples || program.stats) {
    // Single example use case
    shell.find('src')
        .filter( function(file) {
            return file.match(/example\/index.js$/);
        })
        .forEach( function(file) {
            var fullPath =  file.split('/'),
                exampleName;

            exampleName = fullPath.pop(); // index.js
            exampleName = fullPath.pop(); // example
            exampleName = fullPath.pop(); // className

            exampleFound.push(exampleName);
            examples[exampleName] = './' + file;
        });

    // Multi-example use case
    // FIXME / TODO
}

// ----------------------------------------------------------------------------
// Build API
// ----------------------------------------------------------------------------

var traduction = [];
var sideBar = [];
var tabSpace = '  ';

function processModule(mPath) {
  traduction.push(tabSpace + tabSpace + mPath + ': ' + mPath);
  sideBar.push(tabSpace + mPath + ':');

  var bPath = path.join(process.env.PWD, 'src', mPath);
  var classes = shell.ls(bPath)
    .filter( function (f) {
      return shell.test('-d', path.join(bPath,f));
    });

  classes.forEach(function(className) {
    traduction.push(tabSpace + tabSpace + className + ': ' + className);
    sideBar.push(tabSpace + tabSpace + className + ': ' + className + '.html');
    processClass(bPath, className);
  });
}

function processClass(bPath, className) {
  var files = shell.ls(path.join(bPath, className))
        .filter(function(f) {
          return shell.test('-f', path.join(bPath, className, f));
        }),
      apiIdx = files.indexOf('api.md'),
      newPath = path.join(process.env.PWD, 'documentation/www/source/api', className + '.md');

  if(apiIdx !== -1) {
    files.splice(apiIdx, 1);
    apiFound.push(className);
    console.log('  +', className);

    // Create MD file
    ('title: ' + className + '\n---\n').to(newPath);
    shell.cat(path.join(bPath, className, 'api.md')).toEnd(newPath);
  } else {
    console.log('  -', className);
    ('title: ' + className + '\n---\n').to(newPath);
  }

  ('\n\n# Source\n\n').toEnd(newPath);
  files.forEach(function(sFile) {
    ('``` js ' + sFile + '\n').toEnd(newPath);
    shell.cat(path.join(bPath, className, sFile)).toEnd(newPath);
    ('```\n').toEnd(newPath);
  });
}

if(program.api || program.stats) {
    console.log('\n=> Build API\n');
    traduction.push('  api:');
    sideBar.push('api:');
    shell.cd('src');
    shell.find('.')
        .filter( function(file) {
            return file.split('/').length === 2 && shell.test('-d', file);
        })
        .forEach( function(module) {
          processModule(module);
        });
}

// ----------------------------------------------------------------------------
// List examples
// ----------------------------------------------------------------------------

if(program.list) {
    console.log('\n=> Examples list:\n');
    for(var name in examples) {
        console.log(' -', name);
    }
}

// ----------------------------------------------------------------------------
// Stats
// ----------------------------------------------------------------------------

if(program.stats) {
    console.log('\n=> Documentation coverage:\n');


    shell.cd(process.env.PWD);
    var classNames = shell.find('src')
        .filter( function(file) {
            return file.split('/').length === 4 && file.indexOf('index.js') === -1;
        }),
        resultArray = [];

    classNames.forEach( function(file) {
            var fullPath = file.split('/');
            fullPath.shift();
            var fullPathName = fullPath.join('.');
            var className = fullPath.pop();

            resultArray.push({ fullPathName:fullPathName, className:className, api: (apiFound.indexOf(className) !== -1), example: !!examples[className]});
        });

    var apiCount = 0;
    var exampleCount = 0;
    resultArray.forEach(function(i) {
        apiCount += i.api ? 1 : 0;
        exampleCount += i.example ? 1 : 0;
        console.log(i.api ? '+' : '-', i.example ? '+' : '-', i.fullPathName);
    });

    function count(c) {
        return '(' + c + '/' + Math.floor(100*c/resultArray.length) + '%)'
    }

    console.log('\n=> API' + count(apiCount) + ' / Examples' + count(exampleCount) + ' / Total classes(' + resultArray.length + ')\n');
}

// ----------------------------------------------------------------------------
// Build examples
// ----------------------------------------------------------------------------

if(program.examples) {
    var examples = [].concat(program.examples, program.args);
    var buildAll = program.examples === !!program.examples;
    console.log('\n=> Build Examples: ', buildAll ? '(All)' : examples.join(', '));
    console.log();

    // Copy data
    shell.cd(process.env.PWD);
    shell.cp('-r', path.join(process.env.PWD, 'node_modules/tonic-arctic-sample-data/data'), rootWWW + '/public');

    // Build examples
    buildHelper.addDoneListener(doneWithProcessing);
    if(!buildAll) {
        buildHelper.buildList(examples, baseUrl);
    } else {
        buildHelper.buildAll(baseUrl);
    }
} else {
    doneWithProcessing();
}

function doneWithProcessing() {

    // ----------------------------------------------------------------------------
    // Generate examples Markdown for Hexo
    // ----------------------------------------------------------------------------

    traduction.push('  examples:');
    sideBar.push('examples:');
    var exampleGroups = {};
    for(var exampleName in buildHelper.examples) {
      var pathName = buildHelper.examples[exampleName].split('/').splice(2,2).join('/');

      if(exampleGroups[pathName]) {
        exampleGroups[pathName].push(exampleName);
        traduction.push(tabSpace + tabSpace + exampleName + ': ' + exampleName);
      } else {
        traduction.push(tabSpace + tabSpace + pathName + ': ' + pathName);
        traduction.push(tabSpace + tabSpace + exampleName + ': ' + exampleName);
        exampleGroups[pathName] = [ exampleName ];
      }
    }
    for(var gName in exampleGroups) {
      sideBar.push(tabSpace + gName + ':');
      exampleGroups[gName].forEach( function(exampleName) {
        sideBar.push(tabSpace + tabSpace + exampleName + ': ' + exampleName + '.html');
        var destMdFile = path.join(process.env.PWD, 'documentation/www/source/examples', exampleName + '.md');
        (exampleName + '\n----\n### [Live example](./' + exampleName + ')\n\n').to(destMdFile);
        ('<iframe src="./'+ exampleName +'" width="100%" height="500px"></iframe>\n\n### Source\n\n```js\n').toEnd(destMdFile);
        shell.cat(buildHelper.examples[exampleName]).toEnd(destMdFile);
        '\n```\n\n'.toEnd(destMdFile);
      });
    }


    // ----------------------------------------------------------------------------
    // Generate sidebar and traduction for Hexo
    // ----------------------------------------------------------------------------

    var destSideBar = path.join(process.env.PWD, 'documentation/www/source/_data/sidebar.yml');
    var srcSideBar = path.join(process.env.PWD, 'documentation/www/tpl/__sidebar__');
    shell.cat(srcSideBar).to(destSideBar);
    sideBar.join('\n').toEnd(destSideBar);
    ('\n\n').toEnd(destSideBar);

    var destTraduction = path.join(process.env.PWD, 'documentation/www/themes/navy/languages/en.yml');
    var srcTraduction = path.join(process.env.PWD, 'documentation/www/tpl/__en__');
    shell.cat(srcTraduction).to(destTraduction);
    traduction.join('\n').toEnd(destTraduction);
    ('\n\n').toEnd(destTraduction);

    console.log(shell.cat(destSideBar));
    console.log(shell.cat(destTraduction));

    // ----------------------------------------------------------------------------
    // Generate website using Hexo
    // ----------------------------------------------------------------------------

    shell.cd(rootWWW);
    console.log('==> npm install');
    shell.exec('npm install');

    console.log('==> npm run generate');
    shell.exec('npm run generate');

    // ----------------------------------------------------------------------------
    // Github pages
    // ----------------------------------------------------------------------------

    if(program.publish) {
        console.log('\n=> Publish', publishBaseURL, '\n');
        var options = {};

        if(process.env.GIT_PUBLISH_URL) {
            console.log('Use custom URL');
            options.repo = process.env.GIT_PUBLISH_URL;
        }

        require('gh-pages').publish(rootWWW + '/public', options, function(err) {
            if(err) {
                console.log('Error while publishing');
                console.log(err);
            }
            console.log(' - Web site published to github.io');
        });
    }

    // ----------------------------------------------------------------------------
    // Serve local pages
    // ----------------------------------------------------------------------------

    if(program.serve) {
        console.log('\n=> Serve documentation:\n');
        shell.cd(rootWWW);
        shell.exec('npm run server');
    }
}
