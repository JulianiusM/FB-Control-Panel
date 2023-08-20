let request = require("supertest");
let appRef = require("../app.js");
let nock = require("nock");

let app = undefined;
beforeAll(async () => {
	let settings = appRef.settings;
	settings.setFile("./test/resources/settings.csv");
	app = await appRef.main();

	nock("http://pihole.mock.local")
		.get("/pihole/api.php")
		.query({ overTimeData10mins: "", auth: "GENERIC-TOKEN" })
		.replyWithFile(200, "./test/resources/pihole-10min-ok.json");
	nock("http://pihole.mock.local")
		.get("/pihole/api.php")
		.query({ summaryRaw: "", auth: "GENERIC-TOKEN" })
		.replyWithFile(200, "./test/resources/pihole-summary-ok.json");
	nock("http://pihole.mock.local")
		.get("/pihole/api.php")
		.query({ getQueryTypes: "", auth: "GENERIC-TOKEN" })
		.replyWithFile(200, "./test/resources/pihole-queryTypes-ok.json");
	nock("http://pihole.mock.local")
		.get("/pihole/api.php")
		.query({ getForwardDestinations: "", auth: "GENERIC-TOKEN" })
		.replyWithFile(200, "./test/resources/pihole-destinations-ok.json");
	nock("http://speedtest.mock.local")
		.get("/api")
		.replyWithFile(200, "./test/resources/remote-speedtest-ok.json");
});

afterAll(async () => {
	await appRef.tearDown();
});

describe("GET /", () => {
	it("GET / => show index site", async () => {
		const res = await request(app)
			.get("/")
			.expect("Content-Type", /html/)
			.expect(200);
		// Check if title is present
		expect(res.text).toContain("<title>ControlPanel</title>");
		// Check if default params are present
		expect(res.text).toContain(
			'<script type="text/javascript">var config = {};\n' +
				"config.pihole = true;\n" +
				"config.fritzbox = false;\n" +
				"config.callMonPort = 62351;</script>"
		);
	});
});

describe("Test pihole API", () => {
	it("GET /api/queries => show error unbound", async () => {
		const res = await request(app)
			.get("/api/queries")
			.expect("Content-Type", /json/)
			.expect(200);
		expect(res.body.status).toBe("error");
		expect(res.body.message).toBe("No call type specified!");
		expect(res.body.data).toBeNull();
	});

	it("GET /api/queries/10mins => show 10min data", async () => {
		const res = await request(app)
			.get("/api/queries/10mins")
			.expect("Content-Type", /json/)
			.expect(200);
		expect(res.body).toEqual(require("./resources/pihole-10min-ok.json"));
	});

	it("GET /api/queries/summary => show summary data", async () => {
		const res = await request(app)
			.get("/api/queries/summary")
			.expect("Content-Type", /json/)
			.expect(200);
		expect(res.body).toEqual(require("./resources/pihole-summary-ok.json"));
	});

	it("GET /api/queries/types => show query types data", async () => {
		const res = await request(app)
			.get("/api/queries/types")
			.expect("Content-Type", /json/)
			.expect(200);
		expect(res.body).toEqual(
			require("./resources/pihole-queryTypes-ok.json")
		);
	});

	it("GET /api/queries/destinations => show destination data", async () => {
		const res = await request(app)
			.get("/api/queries/destinations")
			.expect("Content-Type", /json/)
			.expect(200);
		expect(res.body).toEqual(
			require("./resources/pihole-destinations-ok.json")
		);
	});
});
