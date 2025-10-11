// F:\src\zarmind\frontend\webpack.config.js

const path = require("path");

module.exports = {
  // 1. The entry point of your application
  entry: "./src/js/app.js",

  // 2. Where to put the bundled code
  output: {
    // Your CSS is going to public/dist/css, so let's put the JS in a similar place
    path: path.resolve(__dirname, "public/dist/js"),
    filename: "bundle.js", // The name of the bundled file
  },

  // 3. The mode is already set by your npm script, but it's good practice to have it here
  mode: "production",
};
