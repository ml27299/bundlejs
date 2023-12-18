import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router-dom";

import useStores from "../../hooks/useStores";
import useStyles from "../../hooks/useStyles";
import useStaticContext from "../../hooks/useStaticContext";

const Page1 = observer(() => {
	const stores = useStores();
	const staticContext = useStaticContext();
	const classes = useStyles("Page1");

	useEffect(() => {}, []);
	console.log({ stores });
	return (
		<React.Fragment>
			<label>Page 1</label>
			<br />
			<label className={classes.labelColor}>
				Static Context: {JSON.stringify(staticContext, null, 4)}
			</label>
			<br />
			<Link to={"/page/2"}>Page 2</Link>
		</React.Fragment>
	);
});

export default Page1;
