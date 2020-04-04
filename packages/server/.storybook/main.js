module.exports = {
  addons: ['@storybook/addon-actions/register'],
  stories: ['../src/**/*.stories.tsx'],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [require('path').resolve(`${__dirname}/../src`)],
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            compilerOptions: {module: 'ESNext'},
            // use transpileOnly mode to speed-up compilation and avoid dealing with config errors
            transpileOnly: true,
          },
        },
        {
          loader: require.resolve('react-docgen-typescript-loader'),
        },
      ],
    });
    config.module.rules.forEach((rule) => {
      if (Array.isArray(rule.use)) {
        rule.use.forEach((loaderConfig) => {
          if (/postcss\-loader/.test(loaderConfig.loader)) {
            loaderConfig.options.plugins = [
              require('tailwindcss'),
              ...loaderConfig.options.plugins(),
            ];
          }
        });
      }
      // {
      //   test: /\.css$/,
      //   use: [
      //     DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
      //     {loader: 'css-loader', options: {importLoaders: 1}},
      //     {
      //       loader: 'postcss-loader',
      //       options: {
      //         ident: 'postcss',
      //         plugins: [
      //           require('tailwindcss'),
      //           require('autoprefixer'),
      //           require('cssnano')({
      //             preset: 'default',
      //           }),
      //         ],
      //       },
      //     },
      //   ],
      // },
    });
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
};
