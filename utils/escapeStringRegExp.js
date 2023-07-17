const escapeStringRegExp = function escapeStringRegExp(str) {
	return str.replace(escapeStringRegExp.matchOperatorsRe, "\\$&");
};
escapeStringRegExp.matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

export { escapeStringRegExp };
