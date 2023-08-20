let express = require("express");
let router = express.Router();

function createRoutes(api) {
	/*-----------[BEGINN>ROUTES]----------*/

	/*-----------[BEGIN>API]----------*/

	//stub for api root
	router.get("/", api.rootCall.bind(api));

	/*-----------[QUERY]----------*/

	//stub for queries api
	router.get("/queries", api.queryRootCall.bind(api));

	//Get dns queries in 10 min intervals api
	router.get("/queries/10mins", api.query10MinCall.bind(api));

	//Get dns queries summary api
	router.get("/queries/summary", api.querySummaryCall.bind(api));

	//Get dns query type api
	router.get("/queries/types", api.queryTypesCall.bind(api));

	//Get dns query forward destination api
	router.get("/queries/destinations", api.queryDestinationsCall.bind(api));

	/*-----------[INTERNET]----------*/

	//stub for internet api
	router.get("/internet", api.internetRootCall.bind(api));

	//Get current dsl info api
	router.get("/internet/info", api.internetInfoCall.bind(api));

	//Get (cached) speed api
	router.get("/internet/speed", api.internetSpeedCall.bind(api));

	//Get online monitor
	router.get("/internet/monitor", api.internetMonitorCall.bind(api));

	/*-----------[PHONE]----------*/

	//stub for internet api
	router.get("/phone", api.phoneRootCall.bind(api));

	//Get call list api
	router.get("/phone/list", api.phoneListCall.bind(api));

	//Get active phone calls
	router.get("/phone/active", api.phoneActiveCall.bind(api));

	/*-----------[WLAN]----------*/

	//stub for wlan api
	router.get("/wlan", api.wlanRootCall.bind(api));

	//Get current wlan info api
	router.get("/wlan/info", api.wlanInfoCall.bind(api));

	//Set wlan enabled
	router.get("/wlan/:id/enable", api.wlanEnableCall.bind(api));

	//Set wps mode
	router.get("/wlan/:id/wps", api.wlanWpsCall.bind(api));

	/*-----------[END>ROUTES]----------*/
	return router;
}

module.exports = { createRoutes: createRoutes };
