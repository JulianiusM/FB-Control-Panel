let WebSocket = require("ws");

module.exports = class CallMonitorSocket {
	constructor(settings, callMonitor) {
		this.settings = settings;
		this.callMonitor = callMonitor;

		if (this.callMonitor && this.settings.isFritzbox()) {
			this.server = new WebSocket.Server({
				port: this.settings.getCallMonitorPort(),
			});

			this.sockets = [];
			this.calls = new Map();

			this.setupSocket();
			this.setupMonitor();
		}
	}

	setupSocket() {
		let self = this;
		this.server.on("connection", function (socket) {
			self.sockets.push(socket);

			socket.on("close", function () {
				self.sockets = self.sockets.filter((s) => s !== socket);
			});

			for (let call of self.calls.values()) {
				self.broadcast(call);
			}
		});
	}

	setupMonitor() {
		let self = this;
		this.callMonitor.on("inbound", (call) => {
			call.type = "inbound";
			call.time = call.time * 1000;
			self.broadcast(call);
			self._saveActiveCall(call);
		});

		this.callMonitor.on("outbound", (call) => {
			call.type = "outbound";
			call.time = call.time * 1000;
			self.broadcast(call);
			self._saveActiveCall(call);
		});

		this.callMonitor.on("connected", (call) => {
			call.type = "connected";
			call.time = call.time * 1000;
			self.broadcast(call);
			self._saveActiveCall(call);
		});

		this.callMonitor.on("disconnected", (call) => {
			call.type = "disconnected";
			self.broadcast(call);
			self.calls.delete(self._getCallMonitorDataKey(call));
		});

		this.callMonitor.on("error", (error) => {
			console.log(error);
		});
	}

	broadcast(data) {
		this.sockets.forEach((s) => s.send(JSON.stringify(data)));
	}

	getActiveCalls() {
		return this.calls.values();
	}

	async tearDown() {
		//TODO
	}

	_saveActiveCall(call) {
		this.calls.set(this._getCallMonitorDataKey(call), call);
	}

	_getCallMonitorDataKey(call) {
		return call.caller + "-" + call.called;
	}
};
