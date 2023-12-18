import React, { useContext } from "react";
import { RootStore } from "@bundlejs/mobx";
import { ScrollToTop } from "@bundlejs/react-router";
import { useHistory } from "react-router-dom";

import { StaticContext } from "../contexts";
import { RootStoreContext } from "@bundlejs/mobx";
import AppController from "./AppController.jsx";

const App = ({ routes = [], staticContext }) => {
	const history = useHistory();

	staticContext = staticContext || useContext(StaticContext) || {};

	const rootStore = new RootStore({
		staticContext,
		history,
	});

	return (
		<RootStoreContext.Provider value={rootStore}>
			<StaticContext.Provider value={staticContext}>
				<AppController routes={routes} />
			</StaticContext.Provider>
		</RootStoreContext.Provider>
	);
};

export default App;
