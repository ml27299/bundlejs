import _, { useContext } from "react";
import { StaticContext } from "../contexts";

const useStaticContext = () => {
	return useContext(StaticContext);
};

export default useStaticContext;
