//Custom conditional class switch
function refreshState(object, validated, validatedClass, invalidatedClass) {
    if (validated && !object.hasClass(validatedClass)) {
        if (object.hasClass(invalidatedClass)) {
            object.removeClass(invalidatedClass);
        }
        object.addClass(validatedClass);
    } else if (!validated && !object.hasClass(invalidatedClass)) {
        if (object.hasClass(validatedClass)) {
            object.removeClass(validatedClass);
        }
        object.addClass(invalidatedClass);
    }
}

//Function to set current location on navbar active
function setCurrentNavLocation() {
    let path = window.location.pathname;

    //Set corresponding nav items active
    if (path.includes("/settings")) {
        $("#settings").addClass("active");
    } else if (path.includes("/login")) {
        $("#login").addClass("active");
    } else if (path.includes("/register")) {
        $("#register").addClass("active");
    }
}

//Verify password (GUI)
function verifyPassword(passwordObj, infoObj) {
    let isEightChars = (passwordObj.val().length >= 8);
    let hasLetter = (/[a-z,A-Z]/g.test(passwordObj.val()));
    let hasDigit = (/\d/g.test(passwordObj.val()));

    //Show tooltip
    infoObj.empty();
    infoObj.append(generateTooltip(isEightChars, hasLetter, hasDigit));

    //Show field status using bootstrap
    refreshState(passwordObj, isPasswordValid(passwordObj.val()), "is-valid", "is-invalid");
}

function matchPassword(passwordObj, passwordRepeatObj, repeatInfoObj) {
    //Hide or show "Passwords do not match"
    refreshState(repeatInfoObj, isPasswordRepeatValid(passwordObj.val(), passwordRepeatObj.val()), "invisible", "visible");

    //Show field status using bootstrap
    refreshState(passwordRepeatObj, isPasswordRepeatValid(passwordObj.val(), passwordRepeatObj.val()), "is-valid", "is-invalid");
}

//Remove tooltip if password is valid when password field looses focus
function removeTooltip(passwordObj, infoObj) {
    if (isPasswordValid(passwordObj.val())) {
        infoObj.empty();
    }
}

//Test if password is vailid
function isPasswordValid(password) {
    return password.length >= 8 && /[a-z,A-Z]/g.test(password) && /\d/g.test(password);
}

//Test if password repeat is valid
function isPasswordRepeatValid(password, passwordRepeat) {
    return password === passwordRepeat;
}

//Generate tooltip html
function generateTooltip(hasEight, hasLettr, hasDigit) {
    //Define tooltip parts
    let tooltipDesc = "<p><b>Password must match the following criteria:</b></p><ul style=\"list-style-type:none\">";
    let tooltipCritOK = "<li style=\"color:green\"><b>✓</b>";
    let tooltipCritNO = "<li style=\"color:red\">🗙";
    let tooltipCritEight = "At least <b>eight (8) characters</b>";
    let tooltipCritLettr = "At least <b>one (1) letter</b>";
    let tooltipCritDigit = "At least <b>one (1) digit</b>";
    let tooltipCritClose = "</li>"
    let tooltipClose = "</ul>";

    //Generate tooltip
    let tooltipHTML = tooltipDesc;
    if (hasEight) {
        tooltipHTML += tooltipCritOK;
    } else {
        tooltipHTML += tooltipCritNO;
    }
    tooltipHTML += (tooltipCritEight + tooltipCritClose);
    if (hasLettr) {
        tooltipHTML += tooltipCritOK;
    } else {
        tooltipHTML += tooltipCritNO;
    }
    tooltipHTML += (tooltipCritLettr + tooltipCritClose);
    if (hasDigit) {
        tooltipHTML += tooltipCritOK;
    } else {
        tooltipHTML += tooltipCritNO;
    }
    tooltipHTML += (tooltipCritDigit + tooltipCritClose);
    tooltipHTML += tooltipClose;

    return tooltipHTML;
}

//Validate passwords on submit and prevent submit if not
function validate(event, passwordObj, passwordRepeatObj, infoObj, passwordRepeatInfoObj) {
    let password = passwordObj.val();
    let passwordRepeat = passwordRepeatObj.val();

    if (!isPasswordValid(password) || !isPasswordRepeatValid(password, passwordRepeat)) {
        event.preventDefault();
        event.stopPropagation();
        alert("Please check that both the password and the password repetition are vaild!");
        verifyPassword(passwordObj, infoObj);
        removeTooltip(passwordObj, infoObj);
        matchPassword(passwordObj, passwordRepeatObj, passwordRepeatInfoObj);
    }
}

var bars = new Map();
//Create or update semicircular progress bar based on barValue and baseValue
function renderMeter(div, fromColor, toColor, barValue, baseValue, unit) {
    let val = barValue / baseValue;

    let bar = bars.get(div);
    if (bar === undefined) {
        bar = new ProgressBar.SemiCircle(div, {
            strokeWidth: 6,
            color: fromColor,
            trailColor: '#eee',
            trailWidth: 1,
            easing: 'easeInOut',
            duration: 1400,
            svgStyle: null,
            text: {
                value: '',
                alignToBottom: true
            },
            from: {
                color: fromColor
            },
            to: {
                color: toColor
            },
            // Set default step function for all animate calls
            step: (state, circle) => {
                circle.path.setAttribute('stroke', state.color);
                if (circle.text == undefined) {
                    circle.setText(barValue + unit);
                }
                circle.text.style.color = state.color;
            }
        });
        bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
        bar.text.classList.add('progbar-text-dyn');
        bars.set(div, bar);
    }

    bar.animate(val >= 0 && val <= 1 ? val : 0); // Number from 0.0 to 1.0
}

// Helper function to update the text of the semicircle progress bars
function updateMeterText(div, barValue, unit) {
    let bar = bars.get(div);
    if (bar != undefined) {
        bar.text.innerHTML = barValue + unit;
    }
}

// Helper function for converting Objects to Arrays after sorting the keys (pi-hole)
function objectToArray(obj) {
    var arr = [];
    var idx = [];
    var keys = Object.keys(obj);

    keys.sort(function (a, b) {
        return a - b;
    });

    for (var i = 0; i < keys.length; i++) {
        arr.push(obj[keys[i]]);
        idx.push(keys[i]);
    }

    return [idx, arr];
}

//Pads numbers
function padNumber(num) {
    return ("00" + num).substr(-2, 2);
}

var callMonitorData = new Map();
var callMonitorAlerts = 0;

function emptyCallMonitor() {
    let listRoot = $("#activeCalllist");
    let alertRoot = $("#activeCallAlerts");

    listRoot.empty();
    alertRoot.empty();
    callMonitorData.clear();
    callMonitorAlerts = 0;
}

function refreshCallMonitor(data) {
    let time = 0;
    let caller = data.caller;
    let called = data.called;

    switch (data.type) {
        case "connected":
        case "inbound":
        case "outbound": {
            time = data.time;
            break;
        }
        case "disconnected": {
            time = data.start;
            break;
        }
    }

    let key = _getCallMonitorDataKey(caller, called);
    callMonitorData.set(key, {
        itemKey: key,
        alertKey: key + "_alert",
        status: data.type,
        start: time,
        caller: caller,
        called: called
    });

    _updateMonitor(key);
}

function _updateMonitor(key) {
    let val = callMonitorData.get(key);
    let listRoot = $("#activeCalllist");
    let alertRoot = $("#activeCallAlerts");
    let callRoot = $("#activeCallRoot");
    let currentItem = $("#" + val.itemKey);
    let currentAlert = $("#" + val.alertKey);

    if (val.status == "disconnected") {
        callMonitorData.delete(key);
        currentItem.remove();
        if (currentAlert.length > 0) {
            currentAlert.remove();
            callMonitorAlerts--;
        }
    } else {
        let itemData = _getMonitorItemData(val);
        let itemDataKeyed = itemData.replace("${{key}}", val.itemKey);
        let alertDataKeyed = itemData.replace("${{key}}", val.alertKey);

        if (currentItem.length > 0) {
            currentItem.replaceWith(itemDataKeyed);
        } else {
            listRoot.append(itemDataKeyed);
        }

        if (val.status != "inbound") {
            if (currentAlert.length > 0) {
                currentAlert.remove();
                callMonitorAlerts--;
            }
        } else if (currentAlert.length == 0) {
            alertRoot.append(alertDataKeyed);
            callMonitorAlerts++;
        }
    }

    refreshState(alertRoot, callMonitorAlerts > 0, "d-block", "d-none");
    refreshState(callRoot, callMonitorData.size > 0, "d-block", "d-none");
}

function _getMonitorItemData(data) {
    let symbol = "phone_callback";
    let symbolColor = "warning";
    if (data.status == "outbound") {
        symbol = "call";
        symbolColor = "info";
    } else if (data.status == "connected") {
        symbol = "settings_phone";
        symbolColor = "success";
    } else if (data.status == "disconnected") {
        symbol = "call_end";
        symbolColor = "danger";
    }

    let startDate = new Date(data.start);

    return "<li class=\"list-group-item list-group-item-" + symbolColor + " text-dark\" id=\"${{key}}\"><div class=\"row\"><div class=\"col-1 align-self-center\"><span class=\"material-icons text-" + symbolColor + "\">" + symbol + "</span></div><div class=\"col-11\">" + data.caller + "<br>" + data.called + " since " + startDate.toLocaleString() + "</div></li>";
}

function _getCallMonitorDataKey(caller, called) {
    return caller.replaceAll("#") + "-" + called.replaceAll("#");
}
