NEWSCHEMA('Recommendation', function (schema) {
    schema.action('generate', {
        name: 'Generate recommendations for specific user',
        params: '*userid:String',
        action: async function ($) {
            let response = FUNC.generateRecommendations($.params.userid);
            $.callback(response);
        },
    });

    schema.action('popular', {
        name: 'Get the popular products for non logged users',
        action: async function ($) {
            let response = (await MAIN.popularProductStore.get()) || [];
            $.json(response);
        },
    });
});
