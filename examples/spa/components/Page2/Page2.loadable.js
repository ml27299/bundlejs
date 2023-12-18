import loadable from "@loadable/component";
import componentResolver from "../../libs/componentResolver";

export default (route) =>
	loadable(() => import("./Page2.component"), {
		ssr: !!route.ssr,
		resolveComponent: (components) => componentResolver(route, components),
	});
