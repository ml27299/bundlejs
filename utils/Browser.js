/* global window, document, atob, btoa */

export function searchToObject(search) {
	return search
		.substring(1)
		.split("&")
		.reduce(function (result, value) {
			var parts = value.split("=");
			if (parts[0])
				result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
			return result;
		}, {});
}

export function atou(b64) {
	if (!b64) return;

	let response;
	if (isBrowser) response = decodeURIComponent(escape(atob(b64)));
	else
		response = decodeURIComponent(
			escape(Buffer.from(b64, "base64").toString("binary"))
		);
	response = response
		.replace(/\\n/g, "\\n")
		.replace(/\\'/g, "\\'")
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, "\\&")
		.replace(/\\r/g, "\\r")
		.replace(/\\t/g, "\\t")
		.replace(/\\b/g, "\\b")
		.replace(/\\f/g, "\\f")
		.replace(/[\u0000-\u0019]+/g, "");

	return response;
}

export function utoa(data) {
	if (!data) return;
	if (isBrowser)
		return btoa(
			unescape(encodeURIComponent(isString(data) ? data : JSON.stringify(data)))
		);
	return Buffer.from(
		unescape(encodeURIComponent(isString(data) ? data : JSON.stringify(data))),
		"binary"
	).toString("base64");
}

export const base64decodeUrl = atou;
export const base64EncodeUrl = utoa;

export function base64decode(b64) {
	if (!b64) return;
	let response;
	if (isBrowser) response = atob(b64);
	else response = Buffer.from(b64, "base64").toString("binary");
	response = response
		.replace(/\\n/g, "\\n")
		.replace(/\\'/g, "\\'")
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, "\\&")
		.replace(/\\r/g, "\\r")
		.replace(/\\t/g, "\\t")
		.replace(/\\b/g, "\\b")
		.replace(/\\f/g, "\\f")
		.replace(/[\u0000-\u0019]+/g, "");

	return response;
}

export function base64encode(data) {
	if (!data) return;
	if (isBrowser) return btoa(isString(data) ? data : JSON.stringify(data));
	return Buffer.from(
		isString(data) ? data : JSON.stringify(data),
		"binary"
	).toString("base64");
}
export function timezoneOffset() {
	var now = new Date();
	var offset = now.getTimezoneOffset() / 60;

	offset = offset * -1;
	var isNeg = offset < 0;
	if (isNeg) offset = offset * -1;
	if (offset < 10) offset = `0${offset}`;
	if (isNeg) offset = `-${offset}`;

	return `${offset}:00`;
}

export function getParameterByName(name, url) {
	if (!isBrowser) return;
	if (!url) url = window.location.href;
	//url = url.toLowerCase();
	name = name.replace(/[[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return "";
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function replaceUrlParam(url, paramName, paramValue) {
	if (paramValue == null) {
		paramValue = "";
	}
	paramValue = encodeURIComponent(paramValue);
	const pattern = new RegExp("\\b(" + paramName + "=).*?(&|#|$)");
	if (url.search(pattern) >= 0) {
		const str = url.replace(
			pattern,
			paramValue ? "$1" + paramValue + "$2" : ""
		);
		return str[str.length - 1] === "&" ? str.substr(0, str.length - 1) : str;
	}

	url = url.replace(/[?#]$/, "");
	if (!paramValue) return url;

	return url + (~url.indexOf("?") ? "&" : "?") + paramName + "=" + paramValue;
}

export function getCookieByName(name) {
	if (!document) return;
	const value = "; " + document.cookie;
	const parts = value.split("; " + name + "=");
	if (parts.length === 2) return parts.pop().split(";").shift();
}

export function setCookieByName(name, value, days = 1) {
	var expires = days === 0 ? "; expires=0" : "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export const isAsyncFunction = (func) =>
	Object.prototype.toString.call(func) === "[object AsyncFunction]";
export const isFunction = (func) =>
	Object.prototype.toString.call(func) === "[object Function]";
export const isString = (str) =>
	Object.prototype.toString.call(str) === "[object String]";
export const isObject = (obj) =>
	Object.prototype.toString.call(obj) === "[object Object]";
export const isArray = (obj) =>
	Object.prototype.toString.call(obj) === "[object Array]";
export const isBrowser = typeof window !== "undefined";
export const isPromise = (obj) => Promise.resolve(obj) === obj;
export const isObjectId = (id) => {
	if (id.match(/^[0-9a-fA-F]{24}$/)) {
		return true;
	} else {
		return false;
	}
};

export function flat(arr, depth = 1) {
	return arr.reduce(function (flat, toFlatten) {
		return flat.concat(
			Array.isArray(toFlatten) && depth > 1
				? toFlatten.flat(depth - 1)
				: toFlatten
		);
	}, []);
}

export const getTemplates = (req, ext) => {
	if (!req) return [];
	const paths = req.keys();

	return paths.map((path) => ({
		component: req(path).default,
		name: path.replace("./", "").replace(ext, "").toLowerCase(),
	}));
};

export const getFilesFromReq = (
	req,
	options = { ext: "js", lowerCaseFileName: false }
) => {
	const { ext, lowerCaseFileName } = options;
	const paths = isBrowser ? req.keys() : [];

	return paths.map((path) => {
		const name = path.replace("./", "").replace(`.${ext.replace(".", "")}`, "");
		return {
			content: req(path).default,
			name: lowerCaseFileName ? name.toLowerCase() : name,
		};
	});
};

export const stripField = (input, field) => {
	const recursive = (input) => {
		if (Array.isArray(input))
			input.forEach((item, key) => (input[key] = recursive(item)));
		if (!isObject(input)) return input;
		for (const key in input) {
			if (key === field) delete input[key];
			else input[key] = recursive(input[key]);
		}
		return input;
	};
	return recursive(input);
};
