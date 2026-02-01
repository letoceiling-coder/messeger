const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const path = require('path');

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // Force axios to use browser build (avoids Node.js modules)
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/axios/dist/browser/axios.cjs'
          ),
          type: 'sourceFile',
        };
      }
      // Empty polyfills for Node built-ins (used by some deps)
      if (['crypto', 'url', 'http', 'https', 'http2', 'stream', 'zlib', 'util'].includes(moduleName)) {
        return { type: 'empty' };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
