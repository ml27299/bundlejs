export default async function (req, res, next) {
	try {
		res.setStaticContext({ foo: "bar" });
		next();
	} catch (err) {
		next(err);
	}
}
