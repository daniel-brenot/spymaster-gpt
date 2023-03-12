const path = require('path');
const nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: './src/index.ts',
  externals: nodeExternals(),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', "es2015", "es2016"],
          }
        }
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
        "path": false,
        "fs": false,
        "url": false,
        "util": false,
        "os": false,
        "https": false,
        "http": false,
        "stream": false,
        "child_process": false,
        "zlib": false,
        "tls": false,
        "constants": false,
        "net": false,
        "assert": false,
        "module": false,
        "readline": false
    }
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};