module.exports = [
  { test: /\.cjson$/, loader: 'hson-loader' },
  { test: /test[^]*\.(png|jpg)$/, use: 'url-loader?limit=1048576' },
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
      {
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'test.onlyIfWebGL',
              replace: process.env.TRAVIS ? 'test.skip' : 'test',
              flags: 'g',
            },
          ],
        },
      },
    ],
  },
];
