#! /usr/bin/env node

/* eslint-disable */
var program = require('commander'),
    connect = require('connect'),
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

if(program.api || program.stats) {
    console.log('\n=> Build API\n');

    var rootTmp = path.join(process.env.PWD, 'documentation/www/source/api');

    shell.mkdir('-p', rootTmp);
    shell.find('src')
        .filter( function(file) {
            return file.match(/api.md$/);
        })
        .forEach( function(file) {
            var filePath = file.split('/'),
                newPath,
                className;

            // Extract class name
            filePath.pop(); // api.md
            className = filePath.pop();

            apiFound.push(className);
            console.log('  -', className);

            newPath = path.join(rootTmp, className + '.md');

            // Copy file
            ('title: ' + className + '\n---\n').to(newPath);
            shell.cat(file).toEnd(newPath);
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
    // Generate website using Hexo
    // ----------------------------------------------------------------------------

    shell.cd(rootWWW);
    shell.exec('npm install');
    shell.exec('npm run build');

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
