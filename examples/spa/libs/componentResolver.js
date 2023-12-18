import withStyles from "./withStyles";

export default (route, components) => {
	return withStyles(
		Object.assign({}, route.extensions?.styles || {}, route.styles || {})
	)(components.default);
};
