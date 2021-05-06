module.exports = (api) => {
  // Testing if babel is being run in test mode

  api.cache(false);
  return {
    presets: [
      // For transformation of JSX and other react related babel plugins
      '@babel/preset-react',
      // Enabling Babel to understand TypeScript
      '@babel/preset-typescript',
      [
        // Allows smart transpilation according to target environments
        '@babel/preset-env',
        {
          // Specifying which browser versions you want to transpile down to
          targets: {
            node: 'current',
          },
          modules: 'commonjs',
        },
      ],
    ],
  };
};
