import assert from 'assert';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';
import CompressionWebpackPlugin from 'compression-webpack-plugin';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import * as dotenv from 'dotenv-extended';
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

dotenv.load();

const {NODE_ENV = 'development'} = process.env;
const DEV = process.env.NODE_ENV !== 'production';

const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./src/**/*.ejs', './src/**/*.ts', './src/**/*.tsx'],
  defaultExtractor: (content: string) => content.match(/[\w-/:]+(?<!:)/g) || [],
});

function removeHashInDev(str: string) {
  return DEV ? str.replace(/\.\[chunkhash\:\d+\]/g, '') : str;
}
assert(
  NODE_ENV === 'development' ||
    NODE_ENV === 'production' ||
    NODE_ENV === 'test',
  'The NODE_ENV environment variable is used by many libraries, and must have a value that is "development", "test" or "production"',
);
const outputFolder = `${__dirname}/dist`;
const config: webpack.Configuration = {
  entry: `${__dirname}/src/ui/index.tsx`,

  performance: DEV
    ? false
    : {
        hints: 'error',
        maxEntrypointSize: 300000,
        maxAssetSize: 500000,
      },

  devServer: {
    // we rely on our actual dev server to serve the html files so you can
    // do proper authentication
    index: '',
    historyApiFallback: false,
    proxy: [
      {
        context: ['!/static/**'],
        target: 'http://localhost:3000',
      },
    ],
    contentBase: [path.join(__dirname, 'dist')],
  },

  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.tsx?$/,
            loader: require.resolve('ts-loader'),
            include: [`${__dirname}/src`],
            options: {
              compilerOptions: {module: 'ESNext'},
              transpileOnly: true, // use transpileOnly mode to speed-up compilation
            },
          },

          {
            test: /\.css$/,
            use: [
              DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
              {loader: 'css-loader', options: {importLoaders: 1}},
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: [
                    require('tailwindcss'),
                    ...(DEV ? [] : [purgecss]),
                    require('autoprefixer'),
                    require('cssnano')({
                      preset: 'default',
                    }),
                  ],
                },
              },
            ],
          },

          {
            test: /\.svg$/,
            use: [
              {
                loader: require.resolve('react-svg-loader'),
                options: {
                  jsx: false,
                  svgo: {
                    plugins: [{uniqueID: require('svgo-unique-id')}],
                  },
                },
              },
            ],
          },

          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },

          {
            // Exclude `js` files to keep "css" loader working as it injects
            // it's runtime that would otherwise processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // Exclude .ejs as it is the template used by HtmlWebpackPlugin
            exclude: [/\.html$/, /\.js$/, /\.json$/, /\.ejs$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },

  output: {
    publicPath: '/',
    path: outputFolder,
    filename: removeHashInDev('static/js/[name].[chunkhash:8].js'),
    // Some of the chunks have been given explit long names, costing an extra ~10KB
    // chunkFilename: removeHashInDev('static/js/[name].[chunkhash:8].chunk.js'),
    chunkFilename: DEV
      ? 'static/js/[name].chunk.js'
      : 'static/js/[chunkhash:8].chunk.js',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    }),

    new MiniCssExtractPlugin({
      filename: removeHashInDev('static/css/[name].[chunkhash:8].css'),
    }),

    // Generate index.html
    new HtmlWebpackPlugin({
      inject: true,
      filename: 'index.html',
      template: `${__dirname}/src/ui/index.ejs`,
      templateParameters: {},
      alwaysWriteToDisk: true,
      minify: DEV
        ? false
        : {
            // https://github.com/kangax/html-minifier#options-quick-reference
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
          },
    }),
    // This plugin is necessary to generate index.html in dev server.
    ...(DEV ? [new HtmlWebpackHarddiskPlugin()] : []),

    // gzip
    new CompressionWebpackPlugin(),

    // delete output folder before build
    ...(!DEV ? [new CleanWebpackPlugin()] : []),
  ],

  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: [
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.ts',
      '.web.jsx',
      '.jsx',
      '.web.js',
      '.js',
      '.svg',
    ],
  },

  mode: DEV ? 'development' : 'production',
};

export default config;
