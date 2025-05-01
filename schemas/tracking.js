NEWSCHEMA('Tracking', function(schema) {
	schema.action('view', {
		name: 'Track product views',
		input: '*userid:String,itemid:String,meta:Object',
		action: async function($, model) {
			FUNC.trackView(model.userid, model.itemid, model.meta);
			$.success();
		}
	});


	schema.action('purchase', {
		name: 'Track product purchase',
		input: '*userid:String,itemid:String,meta:Object',
		action: async function($, model) {
			FUNC.trackPurchase(model.userid, model.itemid, model.meta);
			$.success();
		}
	});


	schema.action('wishlist', {
		name: 'Track product wishlist',
		input: '*userid:String,itemid:String,meta:Object',
		action: async function($, model) {
			FUNC.trackWishlist(model.userid, model.itemid, model.meta);
			$.success();
		}
	});

	schema.action('cart', {
		name: 'Track product cart',
		input: '*userid:String,itemid:String,meta:Object',
		action: async function($, model) {
			FUNC.trackCart(model.userid, model.itemid, model.meta);
			$.success();
		}
	});
});