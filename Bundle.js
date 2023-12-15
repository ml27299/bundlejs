import path from "path";
import required from "./libs/required";
import { isBrowser } from "./utils/Browser";
import { fixRouteOrder } from "./utils/fixRouteOrder";
const { match } = require("node-match-path");

const { NODE_ENV } = process.env;

class Bundle {
	req;
	routes;
	options = {};

	constructor(req, options = {}) {
		this.options = options;
		this.req = req;

		this.routes = [];
		this.routesMap = {};
		const values = this.values;

		const hasRootBundle = values.includes(".");

		for (const bundlePath of values) {
			if (bundlePath === ".") continue;
			this.__addRoutes(bundlePath, hasRootBundle);
		}

		if (hasRootBundle) this.__addRoutes(".");

		if (isBrowser && NODE_ENV !== "test") {
			const routes = fixRouteOrder(this.routes);
			let currentRoute = this.routesMap[window.location.pathname];
			if (!currentRoute) {
				let wildCardRoutes = routes.filter(
					(route) =>
						route.path.indexOf("*") !== -1 || route.path.indexOf(":") !== -1
				);
				wildCardRoutes = fixRouteOrder(wildCardRoutes);
				currentRoute = wildCardRoutes.find((route) => {
					return match(route.path, window.location.pathname);
				});
			}
			const { hydrate, App } = this.findBundleByRoute(currentRoute);
			hydrate(this.generate(currentRoute), currentRoute, App);
		}
	}

	get staticContext() {
		const appStateElem = document.querySelector("#app-page-state");
		return JSON.parse(appStateElem?.innerHTML || "{}");
	}

	get values() {
		const { pageBundlePath } = this.options;
		if (pageBundlePath) {
			return isBrowser ? ["."] : pageBundlePath.split(",");
		}

		if (isBrowser) {
			var { currentRouteBundlePath } = this.staticContext;
			if (currentRouteBundlePath) return [currentRouteBundlePath];
		}
		const paths = this.req.keys();
		return paths.map((p) => path.dirname(p).replace("./", ""));
	}

	__addRoutes(bundlePath, hasRootBundle = false) {
		const generateRoutesFromFilePaths = (filePaths) => {
			let routes = [];
			filePaths.forEach((p) => {
				(asset(p).default || [])
					.filter(Boolean)
					.forEach((route) => routes.push({ value: route, routeFilePath: p }));
			});
			return routes;
		};

		const inferComponentByRouteFilePath = (routeFilePath, loadable) => {
			const rootPath = path.dirname(path.dirname(routeFilePath));
			const targetLoadablePath = loadable
				.keys()
				.find((p) => path.dirname(p) === rootPath);
			if (!targetLoadablePath) return;
			const targetPathName = path.parse(targetLoadablePath).name.split(".")[0];

			const targetPath = path
				.dirname(targetLoadablePath)
				.replace(bundlePath + "/", "");

			if (!targetPath || targetPath === ".") return targetPathName;
			return `${targetPath}/${targetPathName}`;
		};

		const { routes: asset, loadable } = this.findBundleByRoute({
			bundlePath,
		});
		if (!asset) return;

		const routes = generateRoutesFromFilePaths(asset.keys());
		routes.forEach(({ value, routeFilePath }) => {
			if (this.routesMap[value.path]) {
				return;
			}
			const { route } = this.__configureRoute(value, bundlePath);
			if (!route.component) {
				route.component = inferComponentByRouteFilePath(
					routeFilePath,
					loadable
				);
			}

			if (hasRootBundle) route.loadablePath = "ROOT_BUNDLE";
			this.routes.push(route);
			this.routesMap[value.path] = route;
		});
	}

	__configureRoute(route, bundlePath) {
		const { pageBundlePath } = this.options;
		return {
			route: {
				...route,
				__componentPaths: this.routes.map(
					(route) => route.componentPath || bundlePath
				),
				ssr: route.ssr || route.seo,
				componentPath: route.componentPath || bundlePath,
				bundlePath: route.bundlePath || bundlePath,
				loadablePath: pageBundlePath
					? bundlePath
					: bundlePath === "."
					? "ROOT_BUNDLE"
					: bundlePath,
			},
		};
	}

	__getPaths(
		asset = required`asset`,
		route = required`route`,
		routesAsset = required`routesAsset`
	) {
		const bundleRoutes = routesAsset
			.keys()
			.map((p) => routesAsset(p).default)
			.flat();

		if (bundleRoutes.length === 1) {
			return asset.keys();
		}

		const filterNonRelevantPaths = (paths) =>
			paths.filter((p) => {
				const otherRoutes = this.routes.filter(
					(r) => r.path !== route.path && r.component !== route.component
				);
				const conflictingRoute = otherRoutes.find((route) => {
					return p.indexOf(`./${path.dirname(route.component)}/`) === 0;
				});
				return !conflictingRoute;
			});

		const componentPath = `./${route.component}`;
		const paths = asset.keys().reduce((result, path) => {
			const slashCount = path.split("/").length;
			if (!result[slashCount]) result[slashCount] = [];
			result[slashCount].push(path);
			return result;
		}, {});

		let maxIndex = Object.keys(paths).find((index) => {
			return paths[index].find(
				(p) =>
					path.dirname(path.dirname(p)).replace("./", "") ===
					path.dirname(componentPath)
			);
		});

		if (maxIndex === undefined)
			maxIndex = route.component.split("/").length + 2;

		let targetPaths = (paths[maxIndex] || []).filter(
			(p) =>
				path.dirname(path.dirname(p)).replace("./", "") ===
				path.dirname(route.component)
		);

		let parentPaths = Object.keys(paths)
			.filter((index) => parseInt(index) < maxIndex)
			.map((index) => paths[index])
			.flat();

		let childPaths = asset
			.keys()
			.filter((p) => p.indexOf(path.dirname(componentPath) + "/") === 0);

		targetPaths = filterNonRelevantPaths(targetPaths);
		childPaths = filterNonRelevantPaths(childPaths);

		let allPaths = [];
		if (route.includeParentResources) {
			parentPaths = filterNonRelevantPaths(parentPaths);
			allPaths = [...parentPaths, ...targetPaths, ...childPaths];
		} else {
			allPaths = [...targetPaths, ...childPaths];
		}

		return Array.from(new Set(allPaths)).filter(Boolean);
	}

	__assetsWrapper(assets) {
		function wrapper(targetPath) {
			return assets.find(({ path }) => targetPath === path)?.value;
		}
		wrapper.keys = () => assets.map((asset) => asset.path);
		return wrapper;
	}

	__findPathsByRoute(route, { routesAsset, serverAssets, clientAssets }) {
		let fn;
		if (isBrowser) {
			fn = this.__assetsWrapper(clientAssets);
		} else {
			fn = serverAssets;
		}

		return this.__getPaths(fn, route, routesAsset).map((p) => {
			return {
				value: fn(p).default || (isBrowser ? fn(p) : fn(p)),
				name: path.basename(p),
			};
		});
	}

	findStylesByRoute(route = required`route`) {
		const {
			styles: clientStyles,
			serverStyles,
			routes: routesAsset,
		} = this.findBundleByRoute(route);
		if (!clientStyles && !serverStyles) return;
		return this.__findPathsByRoute(route, {
			routesAsset,
			serverAssets: serverStyles,
			clientAssets: clientStyles,
		}).reduce(
			(result, { value, name }) =>
				Object.assign(result, {
					[name.replace(".styles.js", "")]: isBrowser
						? { value, __preInitialized: true }
						: value,
				}),
			{}
		);
	}

	findStoresByRoute(route = required`route`) {
		const {
			stores: clientStores,
			serverStores,
			routes: routesAsset,
		} = this.findBundleByRoute(route);
		if (!clientStores && !serverStores) return;

		return this.__findPathsByRoute(route, {
			routesAsset,
			serverAssets: serverStores,
			clientAssets: clientStores,
		}).reduce(
			(result, { value, name }) =>
				Object.assign(result, {
					[name.replace(".store.js", "Store")]: isBrowser
						? { value, __preInitialized: true }
						: value,
				}),
			{}
		);
	}

	findLoadableComponentByRoute(route = required`route`) {
		const { loadable: asset } = this.findBundleByRoute(route) || {};
		if (!asset) return;
		try {
			const component = asset(`./${route.component}.loadable.js`);
			return component.default;
		} catch (err) {
			return;
		}
	}

	findConstantsByRoute(route = required`route`, filterFn = () => true) {
		const { serverConstants, constants: clientConstants } =
			this.findBundleByRoute(route);
		if (!serverConstants && !clientConstants) return;
		if (serverConstants)
			return serverConstants
				.keys()
				.filter(filterFn)
				.map((p) => ({
					name: path.basename(p, ".json"),
					value: serverConstants(p),
				}))
				.reduce(
					(result, { name, value }) => Object.assign(result, { [name]: value }),
					{}
				);

		return clientConstants
			.filter(({ path: p }) => filterFn(p))
			.reduce((result, { path: p, value }) => {
				const name = path.basename(p, ".json");
				return Object.assign(result, {
					[name]: { value, __preInitialized: true },
				});
			}, {});
	}

	findBackgroundByRoute(route = required`route`) {
		const { background: asset, routes: routesAsset } =
			this.findBundleByRoute(route);
		if (!asset) return;

		const response = this.__getPaths(asset, route, routesAsset);

		if (response.length === 0) return;
		const { default: value, props } = asset(response[response.length - 1]);
		return { value, props };
	}

	findControllersByRoute(route = required`route`) {
		const {
			controllers: clientControllers,
			serverControllers,
			routes: routesAsset,
		} = this.findBundleByRoute(route);
		if (!clientControllers && !serverControllers) return;

		return this.__findPathsByRoute(route, {
			serverAssets: serverControllers,
			clientAssets: clientControllers,
			routesAsset,
		}).map(({ value }) =>
			isBrowser ? { value, __preInitialized: true } : value
		);
	}

	findExtensionsByRoute(route = required`route`) {
		const {
			extensions: clientExtensions,
			serverExtensions,
			routes: routesAsset,
		} = this.findBundleByRoute(route);

		if (!clientExtensions && !serverExtensions) return;

		const response = this.__findPathsByRoute(route, {
			routesAsset,
			serverAssets: serverExtensions,
			clientAssets: clientExtensions,
		});

		if (response.length === 0) return;
		const { value } = response[0];

		return isBrowser ? { value, __preInitialized: true } : value;
	}

	findModelsByRoute(route = required`route`) {
		const {
			models: clientModels,
			serverModels,
			routes: routesAsset,
		} = this.findBundleByRoute(route);
		if (!serverModels && !clientModels) return;

		return this.__findPathsByRoute(route, {
			serverAssets: serverModels,
			clientAssets: clientModels,
			routesAsset,
		}).map(({ value }) =>
			isBrowser ? { value, __preInitialized: true } : value
		);
	}

	findMetaByRoute(route = required`route`, filterFn = () => true) {
		const { meta: asset, routes: routesAsset } = this.findBundleByRoute(route);

		if (!asset) return;

		const response = this.__getPaths(asset, route, routesAsset)
			.filter(filterFn)
			.map((path) => asset(path).default);

		return response;
	}

	findLibsByRoute(route = required`route`) {
		const {
			libs: clientLibs,
			serverLibs,
			routes: routesAsset,
		} = this.findBundleByRoute(route);
		if (!clientLibs && !serverLibs) return;

		return this.__findPathsByRoute(route, {
			serverAssets: serverLibs,
			clientAssets: clientLibs,
			routesAsset,
		}).reduce(
			(result, { value, name }) =>
				Object.assign(result, {
					[name.replace(".js", "")]: isBrowser
						? { value, __preInitialized: true }
						: value,
				}),
			{}
		);
	}

	findBundleByRoute(route = required`route`) {
		try {
			if (route.bundlePath === ".")
				return this.req(`./${this.options.appBundleName}`);
			return this.req(`./${route.bundlePath}/${this.options.appBundleName}`);
		} catch (err) {
			console.error(err);
			return {};
		}
	}

	generate(route) {
		if (route?.seo && !route?.ssr) {
			return [
				{
					...route,
					stores: this.findStoresByRoute(route),
					model: this.findModelsByRoute(route),
					styles: this.findStylesByRoute(route),
					controller: this.findControllersByRoute(route),
					constants: this.findConstantsByRoute(route),
					background: this.findBackgroundByRoute(route),
					libs: this.findLibsByRoute(route),
					meta: this.findMetaByRoute(route),
					extensions: this.findExtensionsByRoute(route),
					component:
						this.findLoadableComponentByRoute(route) || route.component,
				},
			];
		}
		const routes = this.routes.map((route) => ({
			...route,
			stores: this.findStoresByRoute(route),
			model: this.findModelsByRoute(route),
			styles: this.findStylesByRoute(route),
			controller: this.findControllersByRoute(route),
			constants: this.findConstantsByRoute(route),
			background: this.findBackgroundByRoute(route),
			libs: this.findLibsByRoute(route),
			meta: this.findMetaByRoute(route),
			extensions: this.findExtensionsByRoute(route),
			component: this.findLoadableComponentByRoute(route) || route.component,
		}));
		return routes;
	}
}

export default Bundle;
