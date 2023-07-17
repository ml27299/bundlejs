const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const { NODE_ENV } = process.env;
module.exports = ({} = {}) => {
	return {
		target: "node",
		entry: {
			"index": path.resolve(__dirname, "index.js"),
			"utils/index": path.resolve(__dirname, "utils/index.js"),
		},
		optimization: {
			minimize: false,
		},
		devtool: "source-map",
		externals: [nodeExternals()],
		resolve: {
			extensions: [".mjs", ".js", ".jsx"],
		},
		mode: NODE_ENV === "production" ? "production" : "development",
		output: {
			path: path.resolve("dist"),
			filename: "[name].js",
			libraryTarget: "commonjs2",
			sourceMapFilename: "[file].map",
		},
		module: {
			rules: [
				{
					test: /\.(js|jsx|mjs)$/,
					loader: "babel-loader",
					exclude: /node_modules/,
				},
			],
		},
		plugins: [new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)].filter(
			Boolean
		),
	};
};
