
const Redis = require('redis');
ON('ready', function() {

	var client = Redis.createClient();

	MAIN.redisclient = client;

	MAIN.redisclient.on('error', function(err) {
		console.log(err);
		//SHELL('redis-server', NOOP);
	});

	MAIN.redisclient.on('connect', function() {
		console.log('CONNECTED TO REDIS SERVER!');
	});
	MAIN.redisclient.connect();
});

