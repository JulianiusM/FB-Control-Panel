let tr064Ref = require("tr-064");
let querystring = require("querystring");
let fritz = require("fritzbox.js");

// TR-064 API call module
module.exports = class TR064Executor {
	constructor(settings, restExecutor) {
		this.settings = settings;
		this.restExecutor = restExecutor;

		this.tr064 = new tr064Ref.TR064();
		this.fritzbox = undefined;
		this.fritzSec = undefined;

		this.fritzOptions = {
			username: this.settings.getFritzboxUser(),
			password: this.settings.getFritzboxPassword(),
			server: this.settings.getFritzboxHost(),
			protocol: this.settings.getFritzboxProtocol(),
		};

		if (this.settings.isFritzbox()) {
			this.initializeFritzbox();
		}
	}

	initializeFritzbox() {
		let self = this;
		this.tr064.initTR064Device(
			this.fritzOptions.server,
			49000,
			function (err, device) {
				if (err) {
					console.log(err);
					setTimeout(self.initializeFritzbox, 30000);
					return;
				}

				self.fritzbox = device;
				self.fritzbox.startEncryptedCommunication(function (
					err1,
					sslDev
				) {
					if (err1) {
						console.log(err1);
						setTimeout(self.initializeFritzbox, 30000);
						return;
					}

					sslDev.login(
						self.fritzOptions.username,
						self.fritzOptions.password
					);
					self.fritzSec = sslDev;
				});
			}
		);
	}

	getDslInfo(success, failed) {
		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let service =
			this.fritzSec.services[
				"urn:dslforum-org:service:WANDSLInterfaceConfig:1"
			];

		if (service == undefined) {
			failed();
			return;
		}

		service.actions["GetInfo"](function (err, res) {
			if (err) {
				failed();
				return;
			}
			success(res);
		});
	}

	getCallList(success, failed) {
		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let self = this;

		(async () => {
			let calls = await fritz.getCalls(this.fritzOptions);
			if (calls.error) {
				failed();
				return;
			}
			success(calls);
		})();
	}

	getCallMonitor() {
		if (this.fritzSec == undefined) {
			return undefined;
		}

		let callMonitor = new fritz.CallMonitor(this.fritzOptions);
		return callMonitor;
	}

	getOnlineMonitor(success, failed) {
		let self = this;

		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let service =
			this.fritzSec.services[
				"urn:dslforum-org:service:WANCommonInterfaceConfig:1"
			];

		if (service == undefined) {
			failed();
			return;
		}

		service.actions["X_AVM-DE_GetOnlineMonitor"](
			{
				NewSyncGroupIndex: 0,
			},
			function (err, res) {
				if (err) {
					failed();
					return;
				}
				success(res);
			}
		);
	}

	getAllWlanInfo(success, failed) {
		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let self = this;
		let wlanData = [];
		let finished = 0;

		for (let i = 1; i <= 4; i++) {
			setTimeout(() => {
				this.getWlanInfo(
					i,
					function (data) {
						wlanData[i] = data;
						finished++;
						if (finished == 4) {
							success(wlanData);
						}
					},
					function () {
						finished++;
						if (finished == 4) {
							success(wlanData);
						}
					}
				);
			}, 250);
		}
	}

	getWlanInfo(apId, success, failed) {
		let self = this;

		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let service =
			this.fritzSec.services[
				"urn:dslforum-org:service:WLANConfiguration:" + apId
			];

		if (service == undefined) {
			failed();
			return;
		}

		service.actions["GetInfo"](function (err, res) {
			if (err) {
				failed();
				return;
			}
			setTimeout(() => {
				service.actions["GetSecurityKeys"](function (err1, res1) {
					if (err1) {
						failed();
						return;
					}
					setTimeout(() => {
						service.actions["X_AVM-DE_GetWPSInfo"](function (
							err2,
							res2
						) {
							if (err2) {
								failed();
								return;
							}
							let data = {
								ifNo: apId,
								info: res,
								keys: res1,
								wps: res2,
							};
							success(data);
						});
					}, 250);
				});
			}, 250);
		});
	}

	setWlanEnabled(apId, enabled, success, failed) {
		let self = this;

		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let service =
			this.fritzSec.services[
				"urn:dslforum-org:service:WLANConfiguration:" + apId
			];

		if (service == undefined) {
			failed();
			console.log(service);
			return;
		}

		service.actions["SetEnable"](
			{
				NewEnable: enabled,
			},
			function (err, res) {
				if (err) {
					console.log(err);
					failed();
					return;
				}
				success(res);
			}
		);
	}

	setWpsEnabled(apId, enabled, success, failed) {
		let self = this;

		if (this.fritzSec == undefined) {
			failed();
			return;
		}

		let service =
			this.fritzSec.services[
				"urn:dslforum-org:service:WLANConfiguration:" + apId
			];

		if (service == undefined) {
			failed();
			console.log(service);
			return;
		}

		service.actions["X_AVM-DE_SetWPSConfig"](
			{
				"NewX_AVM-DE_WPSMode": enabled ? "pbc" : "stop",
			},
			function (err, res) {
				if (err) {
					console.log(err);
					failed();
					return;
				}
				success(res);
			}
		);
	}
};
