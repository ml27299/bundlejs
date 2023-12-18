import React, { useContext } from "react";
import { stylesContext } from "../contexts";
import { makeStyles } from "@material-ui/core/styles";

export default (styles = {}) =>
	(Component) =>
	(props) => {
		const currentStyles = useContext(stylesContext) || {};
		for (const key in styles) {
			if (styles.hasOwnProperty(key) === false) continue;
			if (currentStyles[key]) continue;
			if (styles[key].then) continue;
			currentStyles[key] = makeStyles(styles[key]);
		}

		return (
			<stylesContext.Provider value={currentStyles}>
				<Component {...props} />
			</stylesContext.Provider>
		);
	};
