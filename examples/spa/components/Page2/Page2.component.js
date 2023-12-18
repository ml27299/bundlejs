import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router-dom";

import useStores from "../../hooks/useStores";
import useStaticContext from "../../hooks/useStaticContext";

const Page2 = observer(() => {
	const stores = useStores();
	const staticContext = useStaticContext();

	useEffect(() => {}, []);
	console.log({ stores });

	return (
		<React.Fragment>
			<label>Page 2</label>
			<br />
			<label>Static Context: {JSON.stringify(staticContext, null, 4)}</label>
			<br />
			<Link to={"/page/1"}>Page 1</Link>
		</React.Fragment>
	);
});

export default Page2;
