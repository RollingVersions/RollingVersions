module.exports = {
  addons: [
    '@storybook/addon-a11y/register',
    '@storybook/addon-actions/register',
    '@storybook/addon-viewport/register',
  ],
  stories: ['../src/**/*.stories.tsx'],
  webpackFinal: async (config) => {
    config.module.rules = [
      {
        oneOf: [
          {
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
          },
          {
            test: /\.svg$/,
            include: [require('path').resolve(`${__dirname}/../src`)],
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
          ...config.module.rules.map((rule) => {
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
            return rule;
          }),
        ],
      },
    ];
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
};
