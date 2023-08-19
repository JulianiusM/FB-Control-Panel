let isConfirmed = false;

function init() {
    registerEvents();
    setCurrentNavLocation();
}

function registerEvents() {
    //Events regarding the password field
    $("#newPassword").on("keyup", function () {
        verifyPassword($("#newPassword"), $("#password-info"));
    });
    $("#newPassword").focusin(function () {
        verifyPassword($("#newPassword"), $("#password-info"));
    });
    $("#newPassword").focusout(function () {
        removeTooltip($("#newPassword"), $("#password-info"));
    });

    //Events regarding password repeat field
    $("#newPasswordRepeat").on("keyup", function () {
        matchPassword($("#newPassword"), $("#newPasswordRepeat"), $("#passwordRepeat-info"));
    });

    //Events regarding submit button
    $("#form").on("submit", function (event) {
        validate(event, $("#newPassword"), $("#newPasswordRepeat"), $("#password-info"), $("#passwordRepeat-info"));
    });

    $("#deleteForm").on("submit", confirm);
}

//Confirm deletion dialog
function confirm(event) {
    if (!isConfirmed) {
        event.preventDefault();
        event.stopPropagation();
        alert("Do you really want to delete your account? \n All your reviews will be deleted. \n To confirm, press delete one more time!");
        isConfirmed = true;
    }
}
