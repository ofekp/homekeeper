const webpack = require('webpack');

module.exports = {
    entry: ['babel-polyfill', './src/index.js'],
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /.(css)$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx']
    },
    output: {
      path: __dirname + '/dist',
      publicPath: '/',
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          WEBAPP_CLIENT_ID: JSON.stringify(process.env.WEBAPP_CLIENT_ID),
        },
      }),
    ],
    devServer: {
      compress: true,
      public: process.env.DOMAIN,
      disableHostCheck: true,
      contentBase: './dist',
      hot: true
    }
};