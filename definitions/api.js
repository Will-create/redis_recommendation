function APICALL(call) {
	let t = this;

	t.call = call;
	t.q = ['token=' + CONF.api_token];
};


let AP = APICALL.prototype;
AP.tostring = function (obj) {
	var arr = [];

	for (var key of Object.keys(obj)) {
		arr.push(key + '_' + obj[key]);
	}

	return arr.join(':');
};


AP.user = function(user) {
	var str = this.tostring(user);
	this.q.push('user=' + str);
	return this;
};

AP.query = function(query) {
	var str = this.tostring(query);
	this.q.push('query=' + str);
	return this;
};


AP.params = function(params) {
	var str = this.tostring(params);
	this.q.push('params=' + str);
	return this;
};

AP.callback = function(cb) {
	var t = this;
	var url = CONF.api_url + '?call=' + t.call + '&' + (t.q.join('&'));

	console.log('Fetching data from: ', url);
	RESTBuilder.GET(url).callback(cb);
};

AP.promise = function() {
	var t = this;
	return new Promise(function(resolve) {
		t.callback(function(err, response) {
			resolve(response);
		});
	});
};

global.APICALL = function (call) {
	return new APICALL(call);
};