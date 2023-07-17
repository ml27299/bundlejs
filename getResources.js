export default async function getResources({ currentRoute }) {
	if (currentRoute.resourcesInitialized) return currentRoute;
	try {
		const objectResourceFields = [
			"stores",
			"styles",
			"libs",
			"model",
			"constants",
			"controller",
		];

		const otherResourceFields = ["extensions"];

		let resources = [];
		for (const resourceField of objectResourceFields) {
			const resourceTargets = currentRoute[resourceField];
			if (!resourceTargets) continue;

			Object.keys(resourceTargets)
				.filter((key) => resourceTargets[key].__preInitialized)
				.forEach((key) =>
					resources.push({
						key,
						value: resourceTargets[key].value,
						resourceField,
					})
				);
		}

		for (const resourceField of otherResourceFields) {
			const resourceTarget = currentRoute[resourceField];
			if (!resourceTarget) continue;
			resources.push({
				value: resourceTarget.value,
				resourceField,
			});
		}
		const responses = await Promise.all(
			resources.map((resource) => resource.value()) //this sometimes fails due to anti virus software, think about forcing a reload if this happens
		);

		responses.forEach((response, i) => (resources[i].value = response));

		for (const resource of resources) {
			if (resource.key) {
				currentRoute[resource.resourceField][resource.key] =
					resource.value.default;
				continue;
			}
			currentRoute[resource.resourceField] = resource.value.default;
		}
		localStorage.removeItem("resourcesErroredAndReloaded");
		return { ...currentRoute, resourcesInitialized: true };
	} catch (err) {
		const reloaded =
			localStorage.getItem("resourcesErroredAndReloaded") === "true";

		if (reloaded) {
			throw err;
		}

		localStorage.setItem("resourcesErroredAndReloaded", "true");
		window.location.reload();
	}
}
