let appRef = require("./app.js");

main();

async function main() {
	let app = await appRef.main();
	let port = appRef.port;

	app.listen(port, function () {
		console.log(`FB-CP listening on Port ${port}`);
	});
}
