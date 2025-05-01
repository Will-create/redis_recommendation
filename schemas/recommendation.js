NEWSCHEMA('Recommendation', function(schema) {
	schema.action('generate', {
		name: 'Generate recommendations for specific user',
		params: '*userid:String',
		action: async function($) {
				let response = FUNC.generateRecommendations($.params.userid);
				$.callback(response);
		}
	});
});