function handleEnable(i, enabled) {
    $.getJSON("/api/wlan/" + i + "/enable?enable=" + !enabled, function (data) {
        refreshWlanStatus(true);
    });
}

function handleWps(i, mode) {
    $.getJSON("/api/wlan/" + i + "/wps?enable=" + (mode != "pbc"), function (data) {
        refreshWlanStatus(true);
    });
}

function refreshWlanStatus(once = false) {
    let root = $("#wlan-row-root");

    $.getJSON("/api/wlan/info", function (data) {
        root.empty();
        let section = 0;
        let sectionFin = 0;
        for (let i in data) {
            if (i % 2 == 0) {
                section++;
                root.append("<div class=\"row mx-0 mt-1 mb-1\" id=\"wlan-sec-row-" + section + "\">");
            }
            let secRow = $("#wlan-sec-row-" + section);
            secRow.append(_createWlanCard(i, data[i]));
            let toggle = $("#wlan-sw-" + i);
            toggle.bootstrapToggle();
            if (i % 2 == 1) {
                sectionFin++;
                root.append("</div>");
            }
        }
        if (section != sectionFin) {
            root.append("</div>");
        }
    }).done(function () {
        if (!once) {
            setTimeout(refreshWlanStatus, 10000);
        }
    });
}

function _createWlanCard(i, data) {
    let statusColor = "warning";
    let statusIcon = "warning";
    if (data.status == "Up") {
        statusColor = "success";
        statusIcon = "check_circle";
    } else if (data.status == "Disabled") {
        statusColor = "danger";
        statusIcon = "dangerous"
    }

    let indent = "mr-md-1";
    if (i % 2 == 1) {
        indent = "ml-md-1";
    }

    let str = "<div class=\"col-md card mt-1 px-0 bg-dark text-white text-center box " + indent + "\"><div class=\"card-header\"><div class=\"row\"><div class=\"col-1 align-self-center\"><span class=\"material-icons text-" + statusColor + "\">" + statusIcon + "</span></div><div class=\"col-6 align-self-center\">" + data.ssid + "</div><div class=\"col-5 align-self-center text-right\"><input type=\"checkbox\" data-toggle=\"toggle\" data-on=\"Enabled\" data-off=\"Disabled\" id=\"wlan-sw-" + i + "\" " + (data.enabled == "1" ? "checked" : "") + " onchange=\"handleEnable(" + data.ifNo + ", " + (data.enabled == "1") + ");\"></div></div></div><div class=\"row card-body text-left\"><div class=\"col-6 col-md-4\"><p>Standard: " + data.standard + "</p><p>Channel: " + data.channel + "</p><p>Type: " + data.type + "</p><button class=\"btn btn-primary\" type=\"button\" data-toggle=\"collapse\" data-target=\"#wlan-collapse-" + i + "\" aria-expanded=\"false\" aria-controls=\"collapseExample\">QR-Code</button></div><div class=\"col-6 col-md-4\"><p>WPS Mode: " + data.wpsMode + "</p><p>WPS Status: " + data.wpsStatus + "</p><button class=\"btn btn-primary\" type=\"button\" onclick=\"handleWps(" + data.ifNo + ", '" + data.wpsMode + "');\">WPS</button></div><div class=\"col-md-4 mt-1 collapse\" id=\"wlan-collapse-" + i + "\">" + data.qrData + "</div></div></div>";

    return str;
}
