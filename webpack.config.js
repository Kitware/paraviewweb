var path = require('path'),
    loaders = require('./config/webpack.loaders.js');

module.exports = {
    plugins: [],
    entry: './src/index.js',
    output: {
        path: './dist',
        filename: 'ParaViewWeb.js',
    },
    module: {
        preLoaders: [{
            test: /\.js$/,
            loader: "eslint-loader",
            exclude: /node_modules/,
        }],
        loaders: [
            { test: require.resolve("./src/index.js"), loader: "expose?ParaViewWeb" },
        ].concat(loaders),
    },
    resolve: {
        alias: {
            PVWStyle: path.resolve('./style'),
        },
    },
    postcss: [
        require('autoprefixer')({ browsers: ['last 2 versions'] }),
    ],
    eslint: {
        configFile: '.eslintrc',
    },
};
