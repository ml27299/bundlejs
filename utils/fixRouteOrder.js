export const fixRouteOrder = (routes = []) => {
	if (routes.length === 0) return routes;
	const wildCardRoutes = routes.filter((route) => ~route.path.indexOf(":"));
	const starWildCardRoutes = routes.filter((route) => ~route.path.indexOf("*"));

	const regRoutes = routes.filter(
		(route) => !~route.path.indexOf(":") && !~route.path.indexOf("*")
	);
	return regRoutes
		.concat(
			wildCardRoutes.sort((a, b) => {
				if (!a) throw new Error("a is undefined");
				if (!b) throw new Error("a is undefined");
				const bAddend = ~b.path.indexOf("(") ? 1 : 0;
				const aAddend = ~a.path.indexOf("(") ? 1 : 0;
				return (
					b.path.split(":").length +
					bAddend -
					(a.path.split(":").length + aAddend)
				);
			})
		)
		.concat(
			starWildCardRoutes.sort((a, b) => {
				const bAddend = ~b.path.indexOf("(") ? 1 : 0;
				const aAddend = ~a.path.indexOf("(") ? 1 : 0;
				return (
					b.path.split("*").length +
					bAddend -
					(a.path.split("*").length + aAddend)
				);
			})
		);
};
