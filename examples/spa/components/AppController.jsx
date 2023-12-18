import React, { useContext } from "react";
import {
	App as BundleJsApp,
	Controller as BundleJSController,
} from "@bundlejs/react-router";

import { useLocation, matchPath } from "react-router-dom";

import { StaticContext } from "../contexts";
import { RootStoreContext } from "@bundlejs/mobx";
import { observer } from "mobx-react";

const AppController = observer(({ routes }) => {
	const location = useLocation();
	const rootStore = useContext(RootStoreContext);
	const route = routes.find((route) => matchPath(location.pathname, route));
	if (!route) return;

	const onStaticContextChangeHandler = (staticContext, route) => {
		rootStore.setStores({
			stores: route.stores,
			libs: route.libs,
			staticContext,
			force: true,
		});
	};

	return (
		<BundleJSController
			routes={routes}
			route={route}
			StaticContext={StaticContext}
			onStaticContextChange={onStaticContextChangeHandler}
		>
			<RootStoreContext.Provider value={rootStore}>
				<BundleJsApp routes={routes} StaticContext={StaticContext} />
			</RootStoreContext.Provider>
		</BundleJSController>
	);
});

export default AppController;
