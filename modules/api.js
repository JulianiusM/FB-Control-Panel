let wifiQr = require("wifi-qr-code-generator");

//API module
module.exports = class API {
	constructor(clients) {
		this.settings = clients.getSettings();
		this.dbClient = clients.getDbExecutor();
		this.restClient = clients.getRestExecutor();
		this.tr064Client = clients.getTr064Executor();
		this.callMonitorSocket = clients.getCallMonitorSocket();
		this.speedtestClient = clients.getSpeedtestExecutor();
		this.renderer = clients.getRenderer();
	}

	rootCall(req, res) {
		this.renderer.respondWithErrorJson(res, "No api specified!");
	}

	queryRootCall(req, res) {
		this.renderer.respondWithErrorJson(res, "No call type specified!");
	}

	internetRootCall(req, res) {
		this.renderer.respondWithErrorJson(res, "No call type specified!");
	}

	phoneRootCall(req, res) {
		this.renderer.respondWithErrorJson(res, "No call type specified!");
	}

	wlanRootCall(req, res) {
		this.renderer.respondWithErrorJson(res, "No call type specified!");
	}

	/* ===== PiHole API ===== */
	query10MinCall(req, res) {
		let self = this;

		this.restClient.performHttpJSONRequest(
			this.settings.getPiholeHost(),
			this.settings.getPiholePath(),
			"GET",
			{
				overTimeData10mins: "",
				auth: this.settings.getPiholeToken(),
			},
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function (err) {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	querySummaryCall(req, res) {
		let self = this;

		this.restClient.performHttpJSONRequest(
			this.settings.getPiholeHost(),
			this.settings.getPiholePath(),
			"GET",
			{
				summaryRaw: "",
				auth: this.settings.getPiholeToken(),
			},
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function (err) {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	queryTypesCall(req, res) {
		let self = this;

		this.restClient.performHttpJSONRequest(
			this.settings.getPiholeHost(),
			this.settings.getPiholePath(),
			"GET",
			{
				getQueryTypes: "",
				auth: this.settings.getPiholeToken(),
			},
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function (err) {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	queryDestinationsCall(req, res) {
		let self = this;

		this.restClient.performHttpJSONRequest(
			this.settings.getPiholeHost(),
			this.settings.getPiholePath(),
			"GET",
			{
				getForwardDestinations: "",
				auth: this.settings.getPiholeToken(),
			},
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function (err) {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	/* ===== Fritzbox API ===== */
	internetInfoCall(req, res) {
		let self = this;

		this.tr064Client.getDslInfo(
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function () {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	internetSpeedCall(req, res) {
		this.renderer.respondWithJson(
			res,
			this.speedtestClient.getSpeedResults()
		);
	}

	internetMonitorCall(req, res) {
		let self = this;

		this.tr064Client.getOnlineMonitor(
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function () {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	phoneListCall(req, res) {
		let self = this;

		this.tr064Client.getCallList(
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function () {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	phoneActiveCall(req, res) {
		let self = this;

		this.renderer.respondithJson(
			res,
			this.callMonitorSocket.getActiveCalls()
		);
	}

	wlanInfoCall(req, res) {
		let self = this;

		this.tr064Client.getAllWlanInfo(function (data) {
			let outData = [];
			let finished = 0;
			for (let wifiData of data) {
				if (wifiData == undefined) {
					finished++;
					if (finished == data.length) {
						self.renderer.respondWithJson(res, outData);
					}
					continue;
				}
				wifiQr
					.generateWifiQRCode({
						ssid: wifiData.info.NewSSID,
						password: wifiData.keys.NewKeyPassphrase,
						encryption: "WPA",
						hiddenSSID: false,
						outputFormat: {
							type: "svg",
						},
					})
					.then(function (qrData) {
						let clientData = {
							ifNo: wifiData.ifNo,
							enabled: wifiData.info.NewEnable,
							status: wifiData.info.NewStatus,
							channel: wifiData.info.NewChannel,
							type: wifiData.info.NewBeaconType,
							standard: wifiData.info.NewStandard,
							ssid: wifiData.info.NewSSID,
							qrData: qrData,
							wpsMode: wifiData.wps["NewX_AVM-DE_WPSMode"],
							wpsStatus: wifiData.wps["NewX_AVM-DE_WPSStatus"],
						};
						outData.push(clientData);
						finished++;
						if (finished == data.length) {
							self.renderer.respondWithJson(res, outData);
						}
					});
			}
		});
	}

	wlanEnableCall(req, res) {
		let self = this;
		let id = req.params.id;
		let enable = req.query.enable;

		this.tr064Client.setWlanEnabled(
			id,
			enable,
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function () {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}

	wlanWpsCall(req, res) {
		let self = this;
		let id = req.params.id;
		let enable = req.query.enable;

		this.tr064Client.setWpsEnabled(
			id,
			enable,
			function (data) {
				self.renderer.respondWithJson(res, data);
			},
			function () {
				self.renderer.respondWithErrorJson(res, "failed");
			}
		);
	}
};
