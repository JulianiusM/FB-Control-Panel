let speedtestRef = require("speedtest-net");

// Speedtest API call module
module.exports = class SpeedtestExecutor {
	constructor(clients) {
		this.clients = clients;
		this.settings = clients.getSettings();
		this.restExecutor = clients.getRestExecutor();

		this.cachedResult = {
			empty: true,
			ping: {
				jitter: 0,
				latency: 0,
			},
			download: {
				bandwidth: 0,
				bytes: 0,
				elapsed: 0,
			},
			upload: {
				bandwidth: 0,
				bytes: 0,
				elapsed: 0,
			},
		};

		this.timer = setTimeout(this.executeSpeedtest.bind(this), 5000);
	}

	executeSpeedtest() {
		let self = this;

		if (this.settings.isRemoteSpeedtest()) {
			let protocolls = this.settings
				.getRemoteSpeedtestUrl()
				.split("://", 2);
			let endpoints = protocolls[1].split("/", 2);

			this.restExecutor.performJSONRequest(
				protocolls[0],
				endpoints[0],
				"/" + endpoints[1],
				"GET",
				"",
				function (result) {
					if (result != undefined && result.empty != true) {
						self.cachedResult = result;
					}
					this.timer = setTimeout(
						self.executeSpeedtest.bind(self),
						5 * 60000
					);
				}
			);
		} else {
			(async () => {
				try {
					let result = await speedtestRef({
						acceptLicense: true,
						acceptGdpr: true,
						serverId: 4404,
					});
					self.cachedResult = result;
					self.cachedResult.empty = false;
				} catch (err) {
					console.error(err);
				} finally {
					this.timer = setTimeout(
						self.executeSpeedtest.bind(self),
						5 * 60000
					);
				}
			})();
		}
	}

	getSpeedResults() {
		return this.cachedResult;
	}

	async tearDown() {
		clearTimeout(this.timer);
		this.timer.unref();
	}
};
