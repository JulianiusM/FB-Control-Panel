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

//Import route modules
let apiRoute = require("./routes/api.js");

//Top level variables
let settings = new settingsRef();
let clients = undefined;

//Start the app
async function main() {
	//Load settings
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
	clients = new clientsRef(dbClient, bcrypt, renderer, settings);
	let auth = new authRef(clients);
	let api = new apiRef(clients);

	//Initialize body parser for post routes
	let urlencodedParser = bodyParser.urlencoded({
		extended: false,
	});

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

	/*-----------[INDEX]----------*/

	//Index route
	app.get("/", function (req, res) {
		renderer.renderWithData(res, "index", {
			navUser: req.session.user,
			pihole: settings.isPihole(),
			fritzbox: settings.isFritzbox(),
			callMonPort: settings.getCallMonitorPort(),
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

	//Load api routes
	app.use("/api", apiRoute.createRoutes(api));

	return app;
}

async function tearDown() {
	if (clients != undefined) {
		await clients.tearDown();
	}
}

module.exports = {
	main: main,
	tearDown: tearDown,
	port: settings.getAppPort(),
	settings: settings,
};
