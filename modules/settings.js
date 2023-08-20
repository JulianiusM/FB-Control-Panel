let path = require("path");

const fs = require("fs");
const csv_reader = require("csv-reader");

module.exports = class Settings {
	constructor() {
		this.remoteSpeedtest = false;
		this.remoteSpeedtestUrl = "http://localhost:3100/api";

		this.pihole = true;
		this.piholeHost = "localhost";
		this.piholePath = "api.php";
		this.piholeToken = "token";

		this.fritzbox = true;
		this.fritzboxHost = "192.168.2.1";
		this.fritzboxProtocol = "https";
		this.fritzboxUser = "user";
		this.fritzboxPassword = "password";

		this.mysqlHost = "localhost";
		this.mysqlPort = "3306";
		this.mysqlUser = "user";
		this.mysqlPassword = "password";
		this.mysqlDatabase = "database";

		this.sessionSecret = "CHANGE__" + this.generateRandomString(20);
		this.appPort = "3000";
		this.callMonPort = "62342";

		this.file = "./settings.csv";
	}

	//----- Remote Speedtest -----
	isRemoteSpeedtest() {
		return this.remoteSpeedtest;
	}

	getRemoteSpeedtestUrl() {
		return this.remoteSpeedtestUrl;
	}

	setRemoteSpeedtest(remoteSpeedtest) {
		this.remoteSpeedtest = remoteSpeedtest;
	}

	setRemoteSpeedtestUrl(remoteSpeedtestUrl) {
		this.remoteSpeedtestUrl = remoteSpeedtestUrl;
	}

	//----- Pihole -----
	isPihole() {
		return this.pihole;
	}

	getPiholeHost() {
		return this.piholeHost;
	}

	getPiholePath() {
		return this.piholePath;
	}

	getPiholeToken() {
		return this.piholeToken;
	}

	setPihole(pihole) {
		this.pihole = pihole;
	}

	setPiholeHost(piholeHost) {
		this.piholeHost = piholeHost;
	}

	setPiholePath(piholePath) {
		this.piholePath = piholePath;
	}

	setPiholeToken(piholeToken) {
		this.piholeToken = piholeToken;
	}

	//----- Fritzbox -----
	isFritzbox() {
		return this.fritzbox;
	}

	getFritzboxHost() {
		return this.fritzboxHost;
	}

	getFritzboxProtocol() {
		return this.fritzboxProtocol;
	}

	getFritzboxUser() {
		return this.fritzboxUser;
	}

	getFritzboxPassword() {
		return this.fritzboxPassword;
	}

	setFritzbox(fritzbox) {
		this.fritzbox = fritzbox;
	}

	setFritzboxHost(fritzboxHost) {
		this.fritzboxHost = fritzboxHost;
	}

	setFritzboxProtocol(fritzboxProtocol) {
		this.fritzboxProtocol = fritzboxProtocol;
	}

	setFritzboxUser(fritzboxUser) {
		this.fritzboxUser = fritzboxUser;
	}

	setFritzboxPassword(fritzboxPassword) {
		this.fritzboxPassword = fritzboxPassword;
	}

	//----- MySQL -----
	getMysqlHost() {
		return this.mysqlHost;
	}

	getMysqlPort() {
		return this.mysqlPort;
	}

	getMysqlDatabase() {
		return this.mysqlDatabase;
	}

	getMysqlUser() {
		return this.mysqlUser;
	}

	getMysqlPassword() {
		return this.mysqlPassword;
	}

	setMysqlHost(mysqlHost) {
		this.mysqlHost = mysqlHost;
	}

	setMysqlPort(mysqlPort) {
		this.mysqlPort = mysqlPort;
	}

	setMysqlDatabase(mysqlDatabase) {
		this.mysqlDatabase = mysqlDatabase;
	}

	setMysqlUser(mysqlUser) {
		this.mysqlUser = mysqlUser;
	}

	setMysqlPassword(mysqlPassword) {
		this.mysqlPassword = mysqlPassword;
	}

	//----- App -----
	getSessionSecret() {
		return this.sessionSecret;
	}

	getAppPort() {
		return this.appPort;
	}

	getCallMonitorPort() {
		return this.callMonPort;
	}

	setSessionSecret(sessionSecret) {
		this.sessionSecret = sessionSecret;
	}

	setAppPort(appPort) {
		this.appPort = appPort;
	}

	setCallMonitorPort(callMonPort) {
		this.callMonPort = callMonPort;
	}

	//----- File -----
	getFile() {
		return this.file;
	}

	setFile(file) {
		this.file = file;
	}

	async readSettingsFile() {
		let self = this;

		//Open inputstream from settings.csv
		let fileInputStream = fs.createReadStream(this.file, "utf-8");

		//Process inputstream with csv-reader
		await new Promise((resolve, reject) => {
			fileInputStream
				.on("error", function (error) {
					console.log("Settings file is not present, create one!");
					self.writeSettingsFile();
					resolve();
				})
				.pipe(
					new csv_reader({
						parseNumbers: false,
						trim: true,
					})
				)
				.on("finish", function () {
					resolve();
				})
				.on("data", function (row) {
					console.log(row);
					switch (row[0]) {
						case "REMOTE_SPEEDTEST":
							self.setRemoteSpeedtest(row[1] == "true");
							break;
						case "REMOTE_SPEEDTEST_URL":
							self.setRemoteSpeedtestUrl(row[1]);
							break;
						case "PIHOLE":
							self.setPihole(row[1] == "true");
							break;
						case "PIHOLE_HOST":
							self.setPiholeHost(row[1]);
							break;
						case "PIHOLE_API_PATH":
							self.setPiholePath(row[1]);
							break;
						case "PIHOLE_API_TOKEN":
							self.setPiholeToken(row[1]);
							break;
						case "FRITZBOX":
							self.setFritzbox(row[1] == "true");
							break;
						case "FRITZBOX_HOST":
							self.setFritzboxHost(row[1]);
							break;
						case "FRITZBOX_PROTOCOL":
							self.setFritzboxProtocol(row[1]);
							break;
						case "FRITZBOX_USER":
							self.setFritzboxUser(row[1]);
							break;
						case "FRITZBOX_PASSWORD":
							self.setFritzboxPassword(row[1]);
							break;
						case "MYSQL_HOST":
							self.setMysqlHost(row[1]);
							break;
						case "MYSQL_PORT":
							self.setMysqlPort(row[1]);
							break;
						case "MYSQL_DATABASE":
							self.setMysqlDatabase(row[1]);
							break;
						case "MYSQL_USER":
							self.setMysqlUser(row[1]);
							break;
						case "MYSQL_PASSWORD":
							self.setMysqlPassword(row[1]);
							break;
						case "SESSION_SECRET":
							self.setSessionSecret(row[1]);
							break;
						case "APP_PORT":
							self.setAppPort(row[1]);
							break;
						case "CALLMONITOR_PORT":
							self.setCallMonitorPort(row[1]);
							break;
						default:
							console.log("Invalid row: " + row);
							break; //Invalid setting; Ignore!
					}
				});
		});
	}

	writeSettingsFile() {
		let contents =
			"REMOTE_SPEEDTEST," +
			this.remoteSpeedtest +
			"\nREMOTE_SPEEDTEST_URL," +
			this.remoteSpeedtestUrl +
			"\nPIHOLE," +
			this.pihole +
			"\nPIHOLE_HOST," +
			this.piholeHost +
			"\nPIHOLE_API_PATH," +
			this.piholePath +
			"\nPIHOLE_API_TOKEN," +
			this.piholeToken +
			"\nFRITZBOX," +
			this.fritzbox +
			"\nFRITZBOX_HOST," +
			this.fritzboxHost +
			"\nFRITZBOX_PROTOCOL," +
			this.fritzboxProtocol +
			"\nFRITZBOX_USER," +
			this.fritzboxUser +
			"\nFRITZBOX_PASSWORD," +
			this.fritzboxPassword +
			"\nMYSQL_HOST," +
			this.mysqlHost +
			"\nMYSQL_PORT," +
			this.mysqlPort +
			"\nMYSQL_DATABASE," +
			this.mysqlDatabase +
			"\nMYSQL_USER," +
			this.mysqlUser +
			"\nMYSQL_PASSWORD," +
			this.mysqlPassword +
			"\nSESSION_SECRET," +
			this.sessionSecret +
			"\nAPP_PORT," +
			this.appPort +
			"\nCALLMONITOR_PORT," +
			this.callMonPort;
		fs.writeFile(this.file, contents, "utf-8", function (error) {
			if (error) {
				console.log("Error writing settings file: " + error);
				return;
			}
			console.log("Settings file written!");
		});
	}

	generateRandomString(length) {
		const chars =
			"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
		const randomArray = Array.from(
			{ length: length },
			(v, k) => chars[Math.floor(Math.random() * chars.length)]
		);

		const randomString = randomArray.join("");
		return randomString;
	}
};
