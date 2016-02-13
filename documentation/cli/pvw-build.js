var path = require('path'),
    webpack = require('webpack'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    examples = {},
    listToBuild = [],
    doneListeners = [];

function buildWebpackConfiguration(name, basepath) {
    var config = {
            plugins: [],
            entry: examples[name],
        output: {
          path: path.join(__dirname, '../www/examples', name),
          filename: name + '.js',
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './documentation/style/template.html',
                inject: 'body',
                title: name,
            }),
            new webpack.DefinePlugin({
                __BASE_PATH__: '' + basepath,
            }),
        ],
        module: {
          loaders: require('../../config/webpack.loaders.js'),
        },
        resolve: {
            alias: {
                PVWStyle: path.resolve('./style'),
            },
        },
        postcss: [
            require('autoprefixer')({ browsers: ['last 2 versions'] }),
        ],
        externals: {
            "three": "THREE",
        },
    };

    return config;
}

// ----------------------------------------------------------------------------

function consumeNextBuild(baseUrl) {
    if(listToBuild.length === 0) {
        doneListeners.forEach(function(l) {
            l();
        })
        return;
    }

    var name = listToBuild.pop();
    var options = buildWebpackConfiguration(name, baseUrl);
    console.log(' - building ' + name);
    webpack(options, function(err, stats){
        if (err) {
            console.error(name + ' has errors.');
            throw err;
        }
        var jsonStats = stats.toJson();
        if (stats.hasErrors()) {
            console.error(' --> Error building ' + name + ', at ' + examples[name]);
            throw jsonStats.errors;
        } else if (stats.hasWarnings()) {
            console.warn(' --> ' + name + ' built with warnings.');
            console.warn(jsonStats.warnings);
        } else {
            console.log(' --> ok');
            consumeNextBuild(baseUrl);
        }
    });
}

// ----------------------------------------------------------------------------

function buildList(list, baseUrl) {
    listToBuild = list;
    consumeNextBuild(baseUrl);
}

// ----------------------------------------------------------------------------

function buildAll(baseUrl) {
    buildList(Object.keys(examples), baseUrl);
}

function addDoneListener(l) {
    doneListeners.push(l);
}

// ----------------------------------------------------------------------------

module.exports = {
    addDoneListener,
    examples,
    buildList,
    buildAll,
}
