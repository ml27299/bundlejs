import React, { useContext } from "react";
import { stylesContext } from "../contexts";

const useStyles = (name) => {
	const styles = useContext(stylesContext);
	if (!styles[name]) return {};
	return styles[name]();
};

export default useStyles;
