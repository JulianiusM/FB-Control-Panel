var failures = 0;
var timeLineChart, queryTypePieChart, forwardDestinationPieChart;

//(pi-hole) colors
var THEME_COLORS = [
	"#f56954",
	"#3c8dbc",
	"#00a65a",
	"#00c0ef",
	"#f39c12",
	"#0073b7",
	"#001f3f",
	"#39cccc",
	"#3d9970",
	"#01ff70",
	"#ff851b",
	"#f012be",
	"#8e24aa",
	"#d81b60",
	"#222222",
	"#d2d6de",
];

//Tooltips
var customTooltips = function (tooltip) {
	var tooltipEl = document.getElementById(
		this._chart.canvas.id + "-customTooltip"
	);
	if (!tooltipEl) {
		// Create Tooltip Element once per chart
		tooltipEl = document.createElement("div");
		tooltipEl.id = this._chart.canvas.id + "-customTooltip";
		tooltipEl.classList.add("chartjs-tooltip");
		tooltipEl.innerHTML = "<div class='arrow'></div> <table></table>";
		// avoid browser's font-zoom since we know that <body>'s
		// font-size was set to 14px by bootstrap's css
		var fontZoom = parseFloat($("body").css("font-size")) / 14;
		// set styles and font
		tooltipEl.style.padding =
			tooltip.yPadding + "px " + tooltip.xPadding + "px";
		tooltipEl.style.borderRadius = tooltip.cornerRadius + "px";
		tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
		tooltipEl.style.fontSize = tooltip.bodyFontSize / fontZoom + "px";
		tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
		// append Tooltip next to canvas-containing box
		tooltipEl.ancestor = this._chart.canvas.closest(".box[id]").parentNode;
		tooltipEl.ancestor.append(tooltipEl);
	}

	// Hide if no tooltip
	if (tooltip.opacity === 0) {
		tooltipEl.style.opacity = 0;
		return;
	}

	// Set caret position
	tooltipEl.classList.remove("left", "right", "center", "top", "bottom");
	tooltipEl.classList.add(tooltip.xAlign, tooltip.yAlign);

	// Set Text
	if (tooltip.body) {
		var titleLines = tooltip.title || [];
		var bodyLines = tooltip.body.map(function (bodyItem) {
			return bodyItem.lines;
		});
		var innerHtml = "<thead>";

		titleLines.forEach(function (title) {
			innerHtml += "<tr><th>" + title + "</th></tr>";
		});
		innerHtml += "</thead><tbody>";
		var printed = 0;

		var devicePixel = (1 / window.devicePixelRatio).toFixed(1);
		bodyLines.forEach(function (body, i) {
			var labelColors = tooltip.labelColors[i];
			var style = "background-color: " + labelColors.backgroundColor;
			style += "; outline: 1px solid " + labelColors.backgroundColor;
			style += "; border: " + devicePixel + "px solid #fff";
			var span =
				"<span class='chartjs-tooltip-key' style='" +
				style +
				"'></span>";

			var num = body[0].split(": ");
			// do not display entries with value of 0 (in bar chart),
			// but pass through entries with "0.0% (in pie charts)
			if (num[1] !== "0") {
				innerHtml += "<tr><td>" + span + body + "</td></tr>";
				printed++;
			}
		});
		if (printed < 1) {
			innerHtml += "<tr><td>No activity recorded</td></tr>";
		}

		innerHtml += "</tbody>";

		var tableRoot = tooltipEl.querySelector("table");
		tableRoot.innerHTML = innerHtml;
	}

	var canvasPos = this._chart.canvas.getBoundingClientRect();
	var boxPos = tooltipEl.ancestor.getBoundingClientRect();
	var offsetX = canvasPos.left - boxPos.left;
	var offsetY = canvasPos.top - boxPos.top;
	var tooltipWidth = tooltipEl.offsetWidth;
	var tooltipHeight = tooltipEl.offsetHeight;
	var caretX = tooltip.caretX;
	var caretY = tooltip.caretY;
	var caretPadding = tooltip.caretPadding;
	var tooltipX, tooltipY, arrowX;
	var arrowMinIndent = 2 * tooltip.cornerRadius;
	var arrowSize = 5;

	// Compute X position
	if (
		$(document).width() > 2 * tooltip.width ||
		tooltip.xAlign !== "center"
	) {
		// If the viewport is wide enough, let the tooltip follow the caret position
		tooltipX = offsetX + caretX;
		if (tooltip.yAlign === "top" || tooltip.yAlign === "bottom") {
			switch (tooltip.xAlign) {
				case "center":
					// set a minimal X position to 5px to prevent
					// the tooltip to stick out left of the viewport
					var minX = 5;
					if (2 * tooltipX < tooltipWidth + minX) {
						arrowX = tooltipX - minX;
						tooltipX = minX;
					} else {
						tooltipX -= tooltipWidth / 2;
					}

					break;
				case "left":
					tooltipX -= arrowMinIndent;
					arrowX = arrowMinIndent;
					break;
				case "right":
					tooltipX -= tooltipWidth - arrowMinIndent;
					arrowX = tooltipWidth - arrowMinIndent;
					break;
				default:
					break;
			}
		} else if (tooltip.yAlign === "center") {
			switch (tooltip.xAlign) {
				case "left":
					tooltipX += caretPadding;
					break;
				case "right":
					tooltipX -= tooltipWidth - caretPadding;
					break;
				case "center":
					tooltipX -= tooltipWidth / 2;
					break;
				default:
					break;
			}
		}
	} else {
		// compute the tooltip's center inside ancestor element
		tooltipX = (tooltipEl.ancestor.offsetWidth - tooltipWidth) / 2;
		// move the tooltip if the arrow would stick out to the left
		if (offsetX + caretX - arrowMinIndent < tooltipX) {
			tooltipX = offsetX + caretX - arrowMinIndent;
		}

		// move the tooltip if the arrow would stick out to the right
		if (offsetX + caretX - tooltipWidth + arrowMinIndent > tooltipX) {
			tooltipX = offsetX + caretX - tooltipWidth + arrowMinIndent;
		}

		arrowX = offsetX + caretX - tooltipX;
	}

	// Compute Y position
	switch (tooltip.yAlign) {
		case "top":
			tooltipY = offsetY + caretY + arrowSize + caretPadding;
			break;
		case "center":
			tooltipY = offsetY + caretY - tooltipHeight / 2;
			if (tooltip.xAlign === "left") {
				tooltipX += arrowSize;
			} else if (tooltip.xAlign === "right") {
				tooltipX -= arrowSize;
			}

			break;
		case "bottom":
			tooltipY =
				offsetY + caretY - tooltipHeight - arrowSize - caretPadding;
			break;
		default:
			break;
	}

	// Position tooltip and display
	tooltipEl.style.top = tooltipY.toFixed(1) + "px";
	tooltipEl.style.left = tooltipX.toFixed(1) + "px";
	if (arrowX === undefined) {
		tooltipEl.querySelector(".arrow").style.left = "";
	} else {
		// Calculate percentage X value depending on the tooltip's
		// width to avoid hanging arrow out on tooltip width changes
		var arrowXpercent = ((100 / tooltipWidth) * arrowX).toFixed(1);
		tooltipEl.querySelector(".arrow").style.left = arrowXpercent + "%";
	}

	tooltipEl.style.opacity = 1;
};

//function (of pi-hole) for updating charts
function updateQueriesOverTime() {
	$.getJSON("/api/queries/10mins", function (data) {
		if ("FTLnotrunning" in data || !Object.keys(data).length) {
			return;
		}

		// convert received objects to arrays
		data.domains_over_time = objectToArray(data.domains_over_time);
		data.ads_over_time = objectToArray(data.ads_over_time);
		// remove last data point since it not representative
		data.ads_over_time[0].splice(-1, 1);
		// Remove possibly already existing data
		timeLineChart.data.labels = [];
		timeLineChart.data.datasets = [];

		var labels = ["Blocked DNS Queries", "Permitted DNS Queries"];
		var blockedColor = "#881111";
		var permittedColor = "#11AA11";
		var colors = [blockedColor, permittedColor];

		// Collect values and colors, and labels
		for (var i = 0; i < labels.length; i++) {
			timeLineChart.data.datasets.push({
				data: [],
				// If we ran out of colors, make a random one
				backgroundColor: colors[i],
				pointRadius: 0,
				pointHitRadius: 5,
				pointHoverRadius: 5,
				label: labels[i],
				cubicInterpolationMode: "monotone",
				stacked: true,
				stack: "1",
			});
		}

		// Add data for each hour that is available
		for (var hour in data.ads_over_time[0]) {
			if (
				Object.prototype.hasOwnProperty.call(
					data.ads_over_time[0],
					hour
				)
			) {
				var h = parseInt(data.domains_over_time[0][hour], 10);
				var d =
					parseInt(data.ads_over_time[0][0], 10) < 1200
						? new Date().setHours(
								Math.floor(h / 6),
								10 * (h % 6),
								0,
								0
						  )
						: new Date(1000 * h);

				var date = d.toLocaleTimeString(undefined, {
					hour: "2-digit",
					minute: "2-digit",
				});

				timeLineChart.data.labels.push(date);
				var blocked = data.ads_over_time[1][hour];
				var permitted = data.domains_over_time[1][hour] - blocked;
				timeLineChart.data.datasets[0].data.push(blocked);
				timeLineChart.data.datasets[1].data.push(permitted);
			}
		}

		$("#queries-over-time .overlay").hide();
		timeLineChart.update();
	})
		.done(function () {
			// Reload graph after 10 minutes
			failures = 0;
			setTimeout(updateQueriesOverTime, 600000);
		})
		.fail(function () {
			failures++;
			if (failures < 5) {
				// Try again after 1 minute only if this has not failed more
				// than five times in a row
				setTimeout(updateQueriesOverTime, 60000);
			}
		});
}

var querytypeids = [];
//function (of pi-hole) for updating query types pie chart
function updateQueryTypesPie() {
	$.getJSON("/api/queries/types", function (data) {
		if ("FTLnotrunning" in data || !Object.keys(data).length) {
			return;
		}

		var v = [],
			c = [],
			k = [],
			i = 0;
		// Collect values and colors, and labels
		var iter = Object.prototype.hasOwnProperty.call(data, "querytypes")
			? data.querytypes
			: data;

		querytypeids = [];
		Object.keys(iter).forEach(function (key) {
			if (iter[key] > 0) {
				v.push(iter[key]);
				c.push(THEME_COLORS[i % THEME_COLORS.length]);
				k.push(key);
				querytypeids.push(i + 1);
			}

			i++;
		});

		// Build a single dataset with the data to be pushed
		var dd = {
			data: v,
			backgroundColor: c,
		};
		// and push it at once
		queryTypePieChart.data.datasets[0] = dd;
		queryTypePieChart.data.labels = k;
		$("#query-types-pie .overlay").hide();
		//queryTypePieChart.chart.config.options.cutoutPercentage = 50;
		queryTypePieChart.update();
		// Don't use rotation animation for further updates
		queryTypePieChart.options.animation.duration = 0;
		// Generate legend in separate div
		$("#query-types-legend").html(queryTypePieChart.generateLegend());
		$("#query-types-legend > ul > li").on("mousedown", function (e) {
			if (e.which === 2) {
				// which == 2 is middle mouse button
				$(this).toggleClass("strike");
				var index = $(this).index();
				var ci = e.view.queryTypePieChart;
				var mobj = ci.data.datasets[0]._meta;
				var metas = Object.keys(mobj).map(function (e) {
					return mobj[e];
				});
				metas.forEach(function (meta) {
					var curr = meta.data[index];
					curr.hidden = !curr.hidden;
				});

				ci.update();
			}
		});
	})
		.done(function () {
			// Reload graph after minute
			setTimeout(updateQueryTypesPie, 60000);
		})
		.fail(function () {
			setTimeout(updateQueryTypesPie, 120000);
		});
}

//function (of pi-hole) for updating forward destination pie chart
function updateForwardDestinationsPie() {
	$.getJSON("/api/queries/destinations", function (data) {
		if ("FTLnotrunning" in data || !Object.keys(data).length) {
			return;
		}

		var v = [],
			c = [],
			k = [],
			i = 0,
			values = [];

		// Collect values and colors
		Object.keys(data.forward_destinations).forEach(function (key) {
			var value = data.forward_destinations[key];

			if (key.indexOf("|") !== -1) {
				key = key.substr(0, key.indexOf("|"));
			}

			values.push([key, value, THEME_COLORS[i++ % THEME_COLORS.length]]);
		});

		// Split data into individual arrays for the graphs
		values.forEach(function (value) {
			k.push(value[0]);
			v.push(value[1]);
			c.push(value[2]);
		});

		// Build a single dataset with the data to be pushed
		var dd = {
			data: v,
			backgroundColor: c,
		};
		// and push it at once
		forwardDestinationPieChart.data.labels = k;
		forwardDestinationPieChart.data.datasets[0] = dd;
		// and push it at once
		$("#forward-destinations-pie .overlay").hide();
		//forwardDestinationPieChart.chart.config.options.cutoutPercentage = 50;
		forwardDestinationPieChart.update();
		// Don't use rotation animation for further updates
		forwardDestinationPieChart.options.animation.duration = 0;
		// Generate legend in separate div
		$("#forward-destinations-legend").html(
			forwardDestinationPieChart.generateLegend()
		);
		$("#forward-destinations-legend > ul > li").on(
			"mousedown",
			function (e) {
				if (e.which === 2) {
					// which == 2 is middle mouse button
					$(this).toggleClass("strike");
					var index = $(this).index();
					var ci = e.view.forwardDestinationPieChart;
					var mobj = ci.data.datasets[0]._meta;
					var metas = Object.keys(mobj).map(function (e) {
						return mobj[e];
					});
					metas.forEach(function (meta) {
						var curr = meta.data[index];
						curr.hidden = !curr.hidden;
					});

					ci.update();
				}
			}
		);
	})
		.done(function () {
			// Reload graph after one minute
			setTimeout(updateForwardDestinationsPie, 60000);
		})
		.fail(function () {
			setTimeout(updateForwardDestinationsPie, 120000);
		});
}

var FTLoffline = false;
//function (of pi-hole) for updating summary
function updateSummaryData(runOnce) {
	var setTimer = function (timeInSeconds) {
		if (!runOnce) {
			setTimeout(updateSummaryData, timeInSeconds * 1000);
		}
	};

	$.getJSON("/api/queries/summary", function (data) {
		if ("FTLnotrunning" in data || !Object.keys(data).length) {
			data.dns_queries_today = "Lost";
			data.ads_blocked_today = "connection";
			data.ads_percentage_today = "to";
			data.domains_being_blocked = "API";
			// Show spinner
			$("#queries-over-time .overlay").show();
			$("#forward-destinations-pie .overlay").show();
			$("#query-types-pie .overlay").show();
			$("#client-frequency .overlay").show();
			$("#domain-frequency .overlay").show();
			$("#ad-frequency .overlay").show();

			FTLoffline = true;
		} else if (FTLoffline) {
			// FTL was previously offline
			FTLoffline = false;
			updateQueriesOverTime();
		}

		var formatter = new Intl.NumberFormat();
		//Element name might have a different name to the property of the API so we split it at |
		[
			"ads_blocked_today|queries_blocked_today",
			"dns_queries_today",
			"ads_percentage_today|percentage_blocked_today",
			"unique_clients",
			"domains_being_blocked",
		].forEach(function (arrayItem, idx) {
			var apiElName = arrayItem.split("|");
			var apiName = apiElName[0];
			var elName = apiElName[1];
			var $todayElement = elName
				? $("span#" + elName)
				: $("span#" + apiName);
			var text = formatter.format(Math.round(data[apiName] * 10) / 10);
			var textData =
				idx === 2 && data[apiName] !== "to" ? text + "%" : text;
			if (
				$todayElement.text() !== textData &&
				$todayElement.text() !== textData + "%"
			) {
				$todayElement.addClass("glow");
				$todayElement.text(textData);
			}
		});

		if (
			Object.prototype.hasOwnProperty.call(data, "dns_queries_all_types")
		) {
			$("#total_queries").prop(
				"title",
				"only A + AAAA queries (" +
					data.dns_queries_all_types +
					" in total)"
			);
		}

		setTimeout(function () {
			$("span.glow").removeClass("glow");
		}, 500);
	})
		.done(function () {
			if (!FTLoffline) {
				setTimer(1);
			} else {
				setTimer(10);
			}
		})
		.fail(function () {
			setTimer(300);
		});
}

function doughnutTooltip(tooltipItems, data) {
	var dataset = data.datasets[tooltipItems.datasetIndex];
	var label = data.labels[tooltipItems.index];
	// Compute share of total and of displayed
	var scale = 0,
		total = 0;
	var metas = Object.keys(dataset._meta).map(function (e) {
		return dataset._meta[e];
	});
	metas.forEach(function (meta) {
		meta.data.forEach(function (val, i) {
			if (val.hidden) scale += dataset.data[i];
			total += dataset.data[i];
		});
	});
	if (scale === 0)
		// All items shown
		return label + ": " + dataset.data[tooltipItems.index].toFixed(1) + "%";
	return (
		label +
		":<br>- " +
		dataset.data[tooltipItems.index].toFixed(1) +
		"% of all queries<br>- " +
		((dataset.data[tooltipItems.index] * 100) / (total - scale)).toFixed(
			1
		) +
		"% of shown items"
	);
}

//function (of pi-hole) for initializing data
function initPiholeData() {
	// Pull in data via AJAX
	updateSummaryData();

	var gridColor = $(".graphs-grid").css("background-color");
	var ticksColor = $(".graphs-ticks").css("color");
	var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
	timeLineChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: [],
			datasets: [
				{
					data: [],
				},
			],
		},
		options: {
			tooltips: {
				enabled: true,
				mode: "x-axis",
				itemSort: function (a, b) {
					return b.datasetIndex - a.datasetIndex;
				},
				callbacks: {
					title: function (tooltipItem) {
						var label = tooltipItem[0].xLabel;
						var time = label.match(/(\d?\d):?(\d?\d?)/);
						var h = parseInt(time[1], 10);
						var m = parseInt(time[2], 10) || 0;
						var from =
							padNumber(h) + ":" + padNumber(m - 5) + ":00";
						var to = padNumber(h) + ":" + padNumber(m + 4) + ":59";
						return "Queries from " + from + " to " + to;
					},
					label: function (tooltipItems, data) {
						if (tooltipItems.datasetIndex === 0) {
							var percentage = 0;
							var permitted = parseInt(
								data.datasets[1].data[tooltipItems.index],
								10
							);
							var blocked = parseInt(
								data.datasets[0].data[tooltipItems.index],
								10
							);
							var total = permitted + blocked;
							if (total > 0) {
								percentage = (100 * blocked) / total;
							}

							return (
								data.datasets[tooltipItems.datasetIndex].label +
								": " +
								tooltipItems.yLabel +
								" (" +
								percentage.toFixed(1) +
								"%)"
							);
						}

						return (
							data.datasets[tooltipItems.datasetIndex].label +
							": " +
							tooltipItems.yLabel
						);
					},
				},
			},
			legend: {
				display: false,
			},
			scales: {
				xAxes: [
					{
						type: "time",
						stacked: true,
						time: {
							unit: "hour",
							displayFormats: {
								hour: "HH:mm",
							},
							tooltipFormat: "HH:mm",
							parser: "HH:mm",
						},
						gridLines: {
							color: gridColor,
						},
						ticks: {
							fontColor: ticksColor,
						},
					},
				],
				yAxes: [
					{
						stacked: true,
						ticks: {
							beginAtZero: true,
							fontColor: ticksColor,
						},
						gridLines: {
							color: gridColor,
						},
					},
				],
			},
			maintainAspectRatio: false,
		},
	});

	// Pull in data via AJAX
	updateQueriesOverTime();

	ctx = document.getElementById("queryTypePieChart").getContext("2d");
	queryTypePieChart = new Chart(ctx, {
		type: "doughnut",
		data: {
			labels: [],
			datasets: [
				{
					data: [],
				},
			],
		},
		options: {
			elements: {
				arc: {
					borderColor: $(".box").css("background-color"),
				},
			},
			legend: {
				display: false,
			},
			tooltips: {
				enabled: false,
				custom: customTooltips,
				callbacks: {
					title: function () {
						return "Query types";
					},
					label: function (tooltipItems, data) {
						return doughnutTooltip(tooltipItems, data);
					},
				},
			},
			animation: {
				duration: 750,
			},
			cutoutPercentage: 0,
		},
	});

	// Pull in data via AJAX
	updateQueryTypesPie();

	ctx = document
		.getElementById("forwardDestinationPieChart")
		.getContext("2d");
	forwardDestinationPieChart = new Chart(ctx, {
		type: "doughnut",
		data: {
			labels: [],
			datasets: [
				{
					data: [],
				},
			],
		},
		options: {
			elements: {
				arc: {
					borderColor: $(".box").css("background-color"),
				},
			},
			legend: {
				display: false,
			},
			tooltips: {
				enabled: false,
				custom: customTooltips,
				callbacks: {
					title: function () {
						return "Forward destinations";
					},
					label: function (tooltipItems, data) {
						return doughnutTooltip(tooltipItems, data);
					},
				},
			},
			animation: {
				duration: 750,
			},
			cutoutPercentage: 0,
		},
	});

	// Pull in data via AJAX
	updateForwardDestinationsPie();
}
