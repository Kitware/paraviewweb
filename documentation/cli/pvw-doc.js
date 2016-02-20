#! /usr/bin/env node

/* eslint-disable */
var program = require('commander'),
    connect = require('connect'),
    shell = require('shelljs'),
    path = require('path'),
    pkg = require('../../package.json'),
    publishBaseURL = pkg.repository.url.split('/').pop().split('.git')[0],
    version = /semantically-release/.test(pkg.version) ? 'development version' : pkg.version,
    baseUrl = "''",
    buildHelper = require('./pvw-build'),
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

shell.rm('-rf', rootWWW);
shell.mkdir('-p', rootWWW);
shell.cd(process.env.PWD);

// ----------------------------------------------------------------------------
// Pre-publish setup (Build everything)
// ----------------------------------------------------------------------------

if(program.publish) {
    baseUrl = "'" + publishBaseURL + "'";
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

    var rootTmp = path.join(process.env.PWD, 'documentation/_tmp');
    var mdocTpl = path.join(process.env.PWD, 'documentation/style/mdoc')

    shell.rm('-rf', rootTmp);
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
            shell.cp('-f', file, newPath);
        });

    // Run mdoc
    var log = console.log;
    console.log = function(){};
    require('mdoc').run({
        inputDir: rootTmp,
        outputDir: path.join(rootWWW,'api'),
        templatePath: mdocTpl,
        baseTitle : 'ParaViewWeb',
        headingLevel : 2,
    });
    console.log = log;

    shell.rm('-rf', rootTmp);
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
    console.log('\n=> Build Examples: ', program.args.length ? program.args.join(', ') : '(All)');
    console.log();

    // Copy data
    shell.cp('-r', path.join(process.env.PWD, 'node_modules/tonic-arctic-sample-data/data'), rootWWW);

    // Build examples
    buildHelper.addDoneListener(doneWithProcessing);
    if(program.args.length) {
        buildHelper.buildList(program.args, baseUrl);
    } else {
        buildHelper.buildAll(baseUrl);
    }
} else {
    doneWithProcessing();
}


function doneWithProcessing() {

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

        require('gh-pages').publish(rootWWW, options, function(err) {
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
        var server = connect();

        server.use(require('serve-static')(rootWWW, { }));
        server.use(require('serve-index')(rootWWW, { }));
        server.listen(3000, function () {
            console.log(' - Server ready at http://localhost:3000');
        });
    }
}
