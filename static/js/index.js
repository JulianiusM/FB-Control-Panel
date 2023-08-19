//Main function; similar in all modules to reduce redundancy in pug code
function init() {
	registerEvents();
	setCurrentNavLocation();
}

function registerEvents() {
	if (config.fritzbox) {
		refreshProgBars();
		refreshCallList();
		initSocket();
		updateOnlineMeter();
		refreshWlanStatus();
	}

	if (config.pihole) {
		initPiholeData();
	}
}

let dsl_up = 0;
let dsl_up_max = 1;
let dsl_down = 0;
let dsl_down_max = 1;
let upload = 0;
let download = 0;

function refreshProgBars() {
	$.getJSON("/api/internet/info", function (data) {
		if (Object.keys(data).length && data.status != "error") {
			dsl_up = Math.round(data["NewUpstreamCurrRate"] / 1000);
			dsl_up_max = Math.round(data["NewUpstreamMaxRate"] / 1000);
			dsl_down = Math.round(data["NewDownstreamCurrRate"] / 1000);
			dsl_down_max = Math.round(data["NewDownstreamMaxRate"] / 1000);
		}

		if (
			isNaN(dsl_up) ||
			isNaN(dsl_up_max) ||
			isNaN(dsl_down) ||
			isNaN(dsl_down_max)
		) {
			//ignore invalid returns; do not render until valid again!
			return;
		}

		renderMeter(
			"#dsl_upl_prg",
			"#bb0000",
			"#009900",
			dsl_up,
			dsl_up_max,
			" Mbit/s"
		);
		renderMeter(
			"#dsl_downl_prg",
			"#bb0000",
			"#009900",
			dsl_down,
			dsl_down_max,
			" Mbit/s"
		);
	})
		.done(function () {
			$.getJSON("/api/internet/speed", function (data) {
				if (Object.keys(data).length && data.status != "error") {
					upload = Math.round(data["upload"].bandwidth / 125004);
					download = Math.round(data["download"].bandwidth / 125004);
				}

				if (isNaN(upload) || isNaN(download)) {
					//ignore invalid returns; do not render until valid again!
					return;
				}

				renderMeter(
					"#upl_prg",
					"#bb0000",
					"#009900",
					upload,
					dsl_up_max,
					" Mbit/s"
				);
				renderMeter(
					"#downl_prg",
					"#bb0000",
					"#009900",
					download,
					dsl_down_max,
					" Mbit/s"
				);
			})
				.done(function () {
					setTimeout(refreshProgBars, 60000);
					setTimeout(_refreshProgBarText, 500);
				})
				.fail(function () {
					setTimeout(refreshProgBars, 120000);
				});
		})
		.fail(function () {
			setTimeout(refreshProgBars, 120000);
		});
}

function refreshCallList() {
	let listRoot = $("#calllist");

	$.getJSON("/api/phone/list", function (data) {
		if (data != undefined && data.length > 0 && data.status != "error") {
			listRoot.empty();
			for (item of data) {
				let name = item.name;
				if (name == undefined || name.trim().length == 0) {
					name = item.number;
				}
				let symbol = "phone_callback";
				let symbolColor = "text-success";
				if (item.type == "outgoing") {
					symbol = "call";
					symbolColor = "text-info";
				} else if (item.type == "missed") {
					symbol = "phone_missed";
					symbolColor = "text-danger";
				}

				listRoot.append(
					'<li class="list-group-item list-group-item-dark text-dark"><div class="row"><div class="col-1 align-self-center"><span class="material-icons ' +
						symbolColor +
						'">' +
						symbol +
						'</span></div><div class="col-11">' +
						name +
						"<br>" +
						item.duration +
						"h on " +
						item.date +
						"</div></li>"
				);
			}
		}
	})
		.done(function () {
			setTimeout(refreshCallList, 60000);
		})
		.fail(function () {
			setTimeout(refreshCallList, 120000);
		});
}

function initSocket() {
	let port = 62391;
	let socket = new WebSocket("ws://" + window.location.hostname + ":" + port);

	socket.onopen = function () {
		//Nothing yet
	};

	socket.onclose = function () {
		socket = null;
		emptyCallMonitor();
		setTimeout(initSocket, 60000);
	};

	socket.onmessage = function (data) {
		let jsonData = JSON.parse(data.data);
		refreshCallMonitor(jsonData);
	};
}

function _refreshProgBarText() {
	updateMeterText("#dsl_upl_prg", dsl_up, " Mbit/s");
	updateMeterText("#dsl_downl_prg", dsl_down, " Mbit/s");
	updateMeterText("#upl_prg", upload, " Mbit/s");
	updateMeterText("#downl_prg", download, " Mbit/s");
}
