let USER = { name: 'API Micro Service',  email: 'api@muald.com', sa: false };

USER.user = function () {
	return this;
};

AUTH(function($) {
	let token = $.headers['token'];

	if (!token || token.length < 20) {
		$.invalid();
		return;
	}

	if (token == CONF.api_token) {
		$.invalid();
		return;
	}

	$.success(USER);
});