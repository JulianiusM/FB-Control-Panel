let downChart, upChart;

function updateOnlineMeter() {
    let labels = ["-5", "-10", "-15", "-20", "-25", "-30", "-35", "-40", "-45", "-50", "-55", "-60", "-65", "-70", "-75", "-80", "-85", "-90", "-95", "-100"];

    let downCtx = document.getElementById("downChart").getContext("2d");
    let upCtx = document.getElementById("upChart").getContext("2d");

    $.getJSON("/api/internet/monitor", function (data) {
        if (!Object.keys(data).length || data.status == "error") {
            $("#downChart .overlay").show();
            $("#upChart .overlay").show();
            return;
        }

        try {

            let ds_max = data.Newmax_ds;
            let us_max = data.Newmax_us;

            let ds_internet = data.Newds_current_bps.split(",");
            let ds_mc = data.Newmc_current_bps.split(",");
            let us_current = data.Newus_current_bps.split(",");
            let us_realtime = data.Newprio_realtime_bps.split(",");
            let us_high = data.Newprio_high_bps.split(",");
            let us_default = data.Newprio_default_bps.split(",");
            let us_low = data.Newprio_low_bps.split(",");

            let downData = [
                {
                    label: 'Internet',
                    data: ds_internet,
                    fill: {
                        target: 'origin',
                    },
                    stack: 'down',
                    order: 0,
                    backgroundColor: 'rgb(195, 195, 9)',
                    tension: 0.1
            },
                {
                    label: 'MC',
                    data: ds_mc,
                    fill: {
                        target: '-1',
                    },
                    stack: 'down',
                    order: 1,
                    backgroundColor: 'rgb(195, 9, 195)',
                    tension: 0.1
            }
        ];

            let upData = [
                {
                    label: 'Realtime',
                    data: us_realtime,
                    fill: {
                        target: '+1',
                    },
                    stack: 'up',
                    order: 3,
                    backgroundColor: 'rgb(75, 195, 195)',
                    tension: 0.1
            },
                {
                    label: 'Priority',
                    data: us_high,
                    fill: {
                        target: '+1',
                    },
                    stack: 'up',
                    order: 2,
                    backgroundColor: 'rgb(235, 175, 55)',
                    tension: 0.1
            },
                {
                    label: 'Normal',
                    data: us_default,
                    fill: {
                        target: '+1',
                    },
                    stack: 'up',
                    order: 1,
                    backgroundColor: 'rgb(55, 175, 55)',
                    tension: 0.1
            },
                {
                    label: 'Background',
                    data: us_low,
                    fill: {
                        target: 'origin',
                    },
                    stack: 'up',
                    order: 0,
                    backgroundColor: 'rgb(55, 95, 235)',
                    tension: 0.1
            }
        ];

            if (downChart == undefined) {
                downChart = new Chart(downCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: downData
                    },
                    options: {
                        scales: {
                            y: {
                                stacked: true,
                                max: ds_max,
                                ticks: {
                                    callback: function (label, index, labels) {
                                        return (label / (1000 * 1000)).toFixed(1) + ' MByte/s';
                                    }
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Downstream'
                                },
                            },
                            x: {
                                reverse: true
                            }
                        },
                        maintainAspectRatio: false
                    }
                });
            } else {
                downChart.data.datasets[0].data = ds_internet;
                downChart.data.datasets[1].data = ds_mc;
            }

            if (upChart == undefined) {
                upChart = new Chart(upCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: upData
                    },
                    options: {
                        scales: {
                            y: {
                                stacked: true,
                                max: us_max,
                                ticks: {
                                    callback: function (label, index, labels) {
                                        return (label / (1000 * 1000)).toFixed(1) + ' MByte/s';
                                    }
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Upstream'
                                },
                            },
                            x: {
                                reverse: true
                            }
                        },
                        maintainAspectRatio: false
                    }
                });
            } else {
                upChart.data.datasets[0].data = us_realtime;
                upChart.data.datasets[1].data = us_high;
                upChart.data.datasets[2].data = us_default;
                upChart.data.datasets[3].data = us_low;
            }

            $("#downChart .overlay").hide();
            downChart.update();
            $("#upChart .overlay").hide();
            upChart.update();

        } catch (err) {
            console.error(err);
            $("#downChart .overlay").show();
            $("#upChart .overlay").show();
        }

    }).done(function () {
        setTimeout(updateOnlineMeter, 5000);
    }).fail(function () {
        setTimeout(updateOnlineMeter, 10000);
    });
}
