exports.install = function() {
	ROUTE('+API      /api/      +tracking_view        *Tracking --> view');
	ROUTE('+API      /api/      +tracking_purchase        *Tracking --> purchase');
	ROUTE('+API      /api/      +tracking_wishlist        *Tracking --> wishlist');
	ROUTE('+API      /api/      +tracking_cart        *Tracking --> cart');
	ROUTE('+API      /api/      -generate/{userid}        *Recommendation --> generate');
	ROUTE('+API      /api/      -popular              *Recommendation --> popular');
};