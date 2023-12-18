const path = require("path");

const {
	BundleJSWebPackPlugin,
	RouteMapPlugin,
	getReactEntries,
} = require("@bundlejs/webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");

const ROOT_COMPONENT_PATH = "components";
const APP_BUNDLE_NAME = "@.bundle.js";

const { reactEntries } = getReactEntries({
	rootComponentPath: ROOT_COMPONENT_PATH,
	appBundleName: APP_BUNDLE_NAME,
});

module.exports = ({} = {}) => {
	return {
		entry: reactEntries,
		devtool: "cheap-module-eval-source-map",
		mode: "development",
		output: {
			publicPath: `/build/js/`,
			path: path.resolve(`build/js`),
			filename: "[name]/main.[hash].js",
			chunkFilename: "[name].[hash].js",
		},
		devServer: {
			static: {
				directory: path.join(__dirname, "/"),
			},
			hot: true,
			host: "localhost",
			port: 1338,
			historyApiFallback: {
				index: "/build/js/index.html",
			},
		},
		optimization: Object.assign({
			moduleIds: "hashed",
			runtimeChunk: {
				name: (entrypoint) => `runtimechunk~${entrypoint.name}`,
			},
			minimize: false,
			minimizer: [],
		}),
		module: {
			rules: [
				{
					test: /\.(js|jsx)$/,
					exclude: /node_modules/,
					loader: "babel-loader",
					options: {
						presets: ["react-app"],
						cacheDirectory: true,
						cacheCompression: false,
						compact: false,
					},
				},
			].filter(Boolean),
		},
		plugins: [
			new BundleJSWebPackPlugin({
				rootComponentPath: ROOT_COMPONENT_PATH,
				appBundleName: APP_BUNDLE_NAME,
			}),
			new RouteMapPlugin({}),
			new HtmlWebpackPlugin({
				template: path.resolve(__dirname, "components/common/index.html"),
			}),
		].filter(Boolean),
		node: {
			module: "empty",
			dgram: "empty",
			dns: "mock",
			fs: "empty",
			net: "empty",
			__dirname: true,
			tls: "empty",
			child_process: "empty",
		},
	};
};
