let querystring = require("querystring");
let http = require("http");
let https = require("https");
let xml2js = require("xml2js");

//REST api call module
module.exports = class RestExecutor {
	constructor(settings, renderer) {
		this.settings = settings;
		this.renderer = renderer;
	}

	performHttpJSONRequest(host, endpoint, method, data, success, error) {
		this.performJSONRequest(
			"http",
			host,
			endpoint,
			method,
			data,
			success,
			error
		);
	}

	performHttpsJSONRequest(host, endpoint, method, data, success, error) {
		this.performJSONRequest(
			"https",
			host,
			endpoint,
			method,
			data,
			success,
			error
		);
	}

	performJSONRequest(protocol, host, endpoint, method, data, success, error) {
		let dataString = JSON.stringify(data);
		let headers = {};

		if (method === "GET") {
			endpoint += "?" + querystring.stringify(data);
		} else {
			headers = {
				"Content-Type": "application/json",
				"Content-Length": dataString.length,
			};
		}

		let port = 80;
		let hostParts = host.split(":");
		if (hostParts.length === 2) {
			host = hostParts[0];
			port = hostParts[1];
		}

		let options = {
			host: host,
			port: port,
			path: endpoint,
			method: method,
			headers: headers,
			rejectUnauthorized: false,
		};

		let callback = function (res) {
			res.setEncoding("utf-8");

			let responseString = "";

			res.on("data", function (data) {
				responseString += data;
			});

			res.on("end", function () {
				if (responseString == "") {
					responseString = "{}";
				}
				try {
					let responseObject = JSON.parse(responseString);
					success(responseObject);
				} catch (err) {
					error(err);
				}
			});
		};

		let req = undefined;
		if (protocol === "http") {
			req = http.request(options, callback);
		} else if (protocol === "https") {
			req = https.request(options, callback);
		} else {
			error("not a valid protocol");
		}

		req.on("error", function (err) {
			console.log(err);
			error(err);
		});

		req.write(dataString);
		req.end();
	}

	performHttpXMLRequest(host, endpoint, method, data, success, error) {
		this.performXMLRequest(
			"http",
			host,
			endpoint,
			method,
			data,
			success,
			error
		);
	}

	performHttpsXMLRequest(host, endpoint, method, data, success, error) {
		this.performXMLRequest(
			"https",
			host,
			endpoint,
			method,
			data,
			success,
			error
		);
	}

	performXMLRequest(protocol, host, endpoint, method, data, success, error) {
		let dataString = new xml2js.Builder().buildObject(data);
		let headers = {};

		if (method === "GET") {
			endpoint += "?" + querystring.stringify(data);
		} else {
			headers = {
				"Content-Type": "application/xml",
				"Content-Length": dataString.length,
			};
		}

		let port = 80;
		let hostParts = host.split(":");
		if (hostParts.length === 2) {
			host = hostParts[0];
			port = hostParts[1];
		}

		let options = {
			host: host,
			port: port,
			path: endpoint,
			method: method,
			headers: headers,
			rejectUnauthorized: false,
		};

		console.log(options);

		let callback = function (res) {
			res.setEncoding("utf-8");

			let responseString = "";

			res.on("data", function (data) {
				responseString += data;
			});

			res.on("end", function () {
				console.log(responseString);
				if (responseString == "") {
					error(undefinded);
				}
				xml2js.parseString(responseString, function (err, result) {
					if (err) {
						console.log(err);
						error(err);
					}
					success(result);
				});
			});
		};

		let req = undefined;
		if (protocol === "http") {
			req = http.request(options, callback);
		} else if (protocol === "https") {
			req = https.request(options, callback);
		} else {
			error("not a vaild protocol");
		}

		req.on("error", function (err) {
			console.log(err);
			error(err);
		});

		req.write(dataString);
		req.end();
	}
};
