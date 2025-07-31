const path = require("path");

module.exports = {
  mode: "development",
  entry: "./public/client/main.js", // Your main client JS
  output: {
    path: path.resolve(__dirname, "public/dist"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader" // Optional: only if you plan to use modern JS (ES6+)
        }
      }
    ]
  },
  devtool: "source-map"
};
