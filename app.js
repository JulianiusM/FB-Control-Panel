//Import modules
let express = require("express");
let mysql = require("mysql");
let bodyParser = require("body-parser");
let session = require("express-session");
let bcrypt = require("bcrypt");

//Import custom modules
let renderer = require("./modules/renderer.js");

let authRef = require("./modules/auth.js");
let clientsRef = require("./modules/clients.js");
let apiRef = require("./modules/api.js");
let settingsRef = require("./modules/settings.js");

//Start the app
main();

async function main() {
	//Load settings
	let settings = new settingsRef();
	await settings.readSettingsFile();

	//Initialize mysql client
	let dbClient = undefined;
	/*dbClient = mysql.createConnection({
		host: settings.getMysqlHost(),
		port: settings.getMysqlPort(),
		database: settings.getMysqlDatabase(),
		user: settings.getMysqlUser(),
		password: settings.getMysqlPassword(),
	});
	dbClient.connect(function (err) {
		if (err) throw err;
		console.log("Connected to database!");
	});*/

	//Initialize custom modules
	let clients = new clientsRef(dbClient, bcrypt, renderer, settings);
	let auth = new authRef(clients);
	let api = new apiRef(clients);

	//Initialize body parser for post routes
	let urlencodedParser = bodyParser.urlencoded({
		extended: false,
	});

	const PORT = settings.getAppPort();

	//Initialize express as app
	let app = express();

	//Use session and static content
	app.use(
		session({
			secret: settings.getSessionSecret(),
			resave: true,
			saveUninitialized: false,
		})
	);
	app.use(express.static("static"));

	//Set view engine to pug
	app.set("views", "views");
	app.set("view engine", "pug");

	/*-----------[BEGINN>ROUTES]----------*/

	/*-----------[INDEX]----------*/

	//Index route
	app.get("/", function (req, res) {
		renderer.renderWithData(res, "index", {
			navUser: req.session.user,
			pihole: settings.isPihole(),
			fritzbox: settings.isFritzbox(),
		});
	});

	/*-----------[LOGIN]----------*/

	//Login route
	app.get("/login", auth.showLogin.bind(auth));

	//Login process route
	app.post("/login", urlencodedParser, auth.login.bind(auth));

	/*-----------[REGISTER]----------*/

	//Registration route
	app.get("/register", auth.showRegister.bind(auth));

	//Registration processing route
	app.post("/register", urlencodedParser, auth.register.bind(auth));

	/*-----------[LOGOUT]----------*/

	//Logout route
	app.get("/logout", auth.logout.bind(auth));

	/*-----------[PROFILE]----------*/

	//Profile route
	app.get("/profile", auth.showProfile.bind(auth));

	//Profile processing route
	app.post(
		"/profile",
		urlencodedParser,
		auth.processProfileSubmit.bind(auth)
	);

	/*-----------[BEGIN>API]----------*/

	//stub for api root
	app.get("/api", api.rootCall.bind(api));

	/*-----------[QUERY]----------*/

	//stub for queries api
	app.get("/api/queries", api.queryRootCall.bind(api));

	//Get dns queries in 10 min intervals api
	app.get("/api/queries/10mins", api.query10MinCall.bind(api));

	//Get dns queries summary api
	app.get("/api/queries/summary", api.querySummaryCall.bind(api));

	//Get dns query type api
	app.get("/api/queries/types", api.queryTypesCall.bind(api));

	//Get dns query forward destination api
	app.get("/api/queries/destinations", api.queryDestinationsCall.bind(api));

	/*-----------[INTERNET]----------*/

	//stub for internet api
	app.get("/api/internet", api.internetRootCall.bind(api));

	//Get current dsl info api
	app.get("/api/internet/info", api.internetInfoCall.bind(api));

	//Get (cached) speed api
	app.get("/api/internet/speed", api.internetSpeedCall.bind(api));

	//Get online monitor
	app.get("/api/internet/monitor", api.internetMonitorCall.bind(api));

	/*-----------[PHONE]----------*/

	//stub for internet api
	app.get("/api/phone", api.phoneRootCall.bind(api));

	//Get call list api
	app.get("/api/phone/list", api.phoneListCall.bind(api));

	//Get active phone calls
	app.get("/api/phone/active", api.phoneActiveCall.bind(api));

	/*-----------[WLAN]----------*/

	//stub for wlan api
	app.get("/api/wlan", api.wlanRootCall.bind(api));

	//Get current wlan info api
	app.get("/api/wlan/info", api.wlanInfoCall.bind(api));

	//Set wlan enabled
	app.get("/api/wlan/:id/enable", api.wlanEnableCall.bind(api));

	//Set wps mode
	app.get("/api/wlan/:id/wps", api.wlanWpsCall.bind(api));

	/*-----------[END>ROUTES]----------*/

	app.listen(PORT, function () {
		console.log(`FB-CP listening on Port ${PORT}`);
	});
}
