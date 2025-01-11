if (process.env.DEBUG === "true") {
  console.log('=== ANGULAR WEBPACK CONFIG LOADED ===');
  console.log('If you see this message, angular.webpack.js is being used in the build process');
  
  console.log('\n=== Environment Variables ===');
  console.log('TARGET:', process.env.TARGET);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DEBUG:', process.env.DEBUG);
  console.log('===========================\n');
}

//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  config.target = "electron-renderer";

  if (options.fileReplacements) {
    for (let fileReplacement of options.fileReplacements) {
      if (fileReplacement.replace !== "src/environments/environment.ts") {
        continue;
      }

      let fileReplacementParts = fileReplacement["with"].split(".");
      if (
        fileReplacementParts.length > 1 &&
        ["web"].indexOf(fileReplacementParts[1]) >= 0
      ) {
        config.target = "web";
      }
      break;
    }
  }

  config.plugins = [
    ...config.plugins,
    //new webpack.DefinePlugin({
    //  process: "process/browser",
    //}),
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
  ];

  //my own stuff
  //add BundleAnalyzerPlugin for non-production builds
  if (!options.optimization) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  if (process.env.TARGET === "electron") {
    config.target = "electron-renderer";
  } else {
    config.target = "web";

    config.resolve = {
      ...config.resolve,
      fallback: { fs: false, child_process: false, net: false },
    };
  }

  console.log("=== Webpack Configuration ===");
  console.log("TARGET:", process.env.TARGET);
  console.log("config.target:", config.target);
  console.log("Source maps enabled:", config.devtool ? true : false);

  if (config.target === "electron-renderer") {
    config.externals.electron = 'require("electron")';
    console.log("Added electron to externals");
  }

  // Ensure source maps are enabled for development
  if (!options.optimization) {
    config.devtool = 'source-map';
    console.log("Forced source-map devtool for development");
  }

  console.log("Final devtool:", config.devtool);
  console.log("============================");
  //end my own stuff

  return config;
};
