let dbExecutorRef = require("./dbExecutor.js");
let restExecutorRef = require("./restExecutor.js");
let tr064ExecutorRef = require("./tr064Executor.js");
let speedtestExecutorRef = require("./speedtestExecutor.js");
let callMonitorSocketRef = require("./callMonitorSocket.js");

//Wrapper class for some clients used by other classes
module.exports = class Clients {
	constructor(dbClient, bcrypt, renderer, settings) {
		this.dbClient = dbClient;
		this.bcrypt = bcrypt;
		this.renderer = renderer;
		this.settings = settings;
		this.dbExecutor = new dbExecutorRef(dbClient, renderer);
		this.restExecutor = new restExecutorRef(settings, renderer);
		this.tr064Executor = new tr064ExecutorRef(settings, this.restExecutor);
		this.speedtestExecutor = new speedtestExecutorRef(this);
		this.callMonitorSocket = new callMonitorSocketRef(
			settings,
			this.tr064Executor.getCallMonitor()
		);
	}

	getDbClient() {
		return this.dbClient;
	}

	getBcrypt() {
		return this.bcrypt;
	}

	getRenderer() {
		return this.renderer;
	}

	getSettings() {
		return this.settings;
	}

	getDbExecutor() {
		return this.dbExecutor;
	}

	getRestExecutor() {
		return this.restExecutor;
	}

	getTr064Executor() {
		return this.tr064Executor;
	}

	getSpeedtestExecutor() {
		return this.speedtestExecutor;
	}

	getCallMonitorSocket() {
		return this.callMonitorSocket;
	}

	async tearDown() {
		await this.speedtestExecutor.tearDown();
		await this.callMonitorSocket.tearDown();
	}
};
