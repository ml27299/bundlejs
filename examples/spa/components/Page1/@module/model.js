import * as yup from "yup";

export default (data) => {
	return yup
		.object()
		.shape({
			foo: yup.string().required(),
		})
		.validate(data);
};
