import required from "../libs/required";

export const parseStores = (req = required`req`) => {
	return req.keys().reduce((result, path) => {
		if (!req(path).default) {
			console.error(`${path} is undefined...`);
		}
		const indexName = path.split("/").pop().replace(".store.js", "Store");
		return Object.assign(
			{},
			result,
			req(path).default
				? {
						[`${indexName === "init" ? path : indexName}`]: req(path).default,
				  }
				: {}
		);
	}, {});
};

export const parseStyles = (req = required`req`) => {
	return req.keys().reduce(
		(result, path) =>
			Object.assign(
				{},
				result,
				req(path).default
					? {
							[`${path.split("/").pop().replace(".styles.js", "")}`]:
								req(path).default,
					  }
					: {}
			),
		{}
	);
};

export const parseConstants = (req = required`req`, filter) => {
	return req
		.keys()
		.filter(
			filter ||
				((path) =>
					path.split("@constants")?.reverse()[0]?.split("/").length === 2)
		)
		.reduce(
			(result, path) =>
				Object.assign({}, result, {
					[`${path.split("/").pop().replace(".json", "")}`]: req(path),
				}),
			{}
		);
};
