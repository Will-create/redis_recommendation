const USER = { name: 'Admin', email: 'admin@admin.com', sa: true };
const ANONYME = { id: 'id', name: 'Anonyme', email: 'anonyme@email.com', sa: false };
MAIN.ano = ANONYME;
USER.json = function() {
	return this;
};


let component1 = `
<script total>
exports.id = 'on{id}';
exports.name = 'Redis:on {name}';
exports.group = 'REDIS Updates';
exports.version = '1';
exports.icon = 'ti ti-bolt';
exports.author = 'Total.js';
exports.outputs = [{ id: 'output', name: 'Output' }];
exports.type = 'input';

exports.make = function(instance, config) {
instance.input = function(fromflowstreamid, fromid, data) {
instance.send('output', data);
};
};
</script>

<readme>
The component will capture the update of a redis store.
</readme>

<body>
<header>
<i class="ICON"></i>NAME
</header>
</body>
`;

let component2 = `
<script total>
exports.id = '{id}';
exports.name = 'Redis: {name}';
exports.group = 'Redis';
exports.version = '1';
exports.icon = 'ti ti-badge';
exports.author = 'Total.js';
exports.inputs = [{ id: 'input', name: 'Input' }];
exports.outputs = [{ id: 'output', name: 'Output' }, { id: 'error', name: 'Error' }];
exports.make = function(instance, config) {
instance.message = function($) {
instance.main.rpc('{id}', $.data, function(err) {
if (err)
$.send('error', err);
else
$.send('output');
});
};
};
</script>

<readme>
The component will register redis store component. The input must contain the id {String} of the eshop to be certified.
</readme>
<body>
<header>
<i class="ICON"></i>NAME
</header>
</body>
`;
global.REDIS_STORE = function(name) {
	var ttl = 60;
	var hasttl = name.indexOf('/') > -1;
	let self = this;

	if (hasttl) {
		ttl = parseInt(name.split('/')[1].trim());
		name = name.split('/')[0].trim();
	}

	self.ttl = ttl;

	self.name = name;

	let redistore = name;

	ON('redisstore', function(instance) {
		var arr = [];

		// First i create component 1
		arr.push(function(next) {
			var body = component1.args({ id: redistore, name: redistore });
			instance.add('on' + redistore, body, async function(error, res) {
				next();
			});
		});

		// THen create component 2
		arr.push(function(next) {
			var body = component2.args({ id: redistore, name: redistore });
			instance.add(redistore, body, async function(error, res) {
				next();
			});
		});

		// Finally run asunc
		arr.async(function() {
			Flow.rpc(redistore, async function(data, callback) {
				var response = await self[data.key](data.a,data.b, data.c);
				callback(response);
			});
		})

	});
};

var rsproto = REDIS_STORE.prototype;

rsproto.autoquery = function(query) {
	var temp = [];
	for (var key of Object.keys(query)) {
		temp.push(key + ':' + query[key]);
	}
	this.query = temp;
	return this;
};

rsproto.userid = function(userid) {
	if (this.name.indexOf(userid) == -1)
		this.name = this.name + ':' + userid;
	this.userid = userid;
	return this;
};

rsproto.get = function(k, find) {
	var self = this;

	if (!k && !find)
		k = 'all';

	return new Promise(async (resolve) => {
		try {
			var val = await MAIN.redisclient.json.get(self.name + (k ? ':' + k : ':all'));

			var arr = val || [];

			if (!k) {
				resolve(arr);
				return;
			}

			// Apply query filters if available
			if (self.query) {
				var groups = self.query;
				for (var group of groups) {
					var [key, value] = group.split(':');
					arr = arr.filter((item) => item[key] && item[key].toString().toLowerCase().includes(value.toLowerCase()));
				}
				self.query = null;
			}

			if (find) {
				const result = arr.find(item => item.id === k);
				resolve(result || null);
			} else {
				var val = await MAIN.redisclient.json.get(self.name + ':' + k);
				resolve(val);
			}
		} catch (err) {
			console.error("Error getting value from RedisJSON:", err);
			resolve(null);
		}
	});
};

rsproto.set = function(k, v) {
	var self = this;
	if (!v) {
		v = k;
		k = null;
	}

	var key = k ? self.name + ':' + k : self.name + ':all';

	return new Promise(async (resolve, reject) => {
		try {
			await MAIN.redisclient.json.set(key, '$', v);
			await MAIN.redisclient.expire(key, self.ttl);
			Flow.input(self.name, '@set', { user: self.userid , model: v, ttl: self.ttl });
			resolve();
		} catch (err) {
			console.error("Error setting value in RedisJSON:", err);
			reject(err);
		}
	});
};

rsproto.clean = rsproto.remove = function(k) {
	var self = this;
	return new Promise(async (resolve, reject) => {
		try {
			await MAIN.redisclient.json.del(self.name + ':' + k);
			resolve();
		} catch (err) {
			console.error("Error removing value from RedisJSON:", err);
			reject(err);
		}
	});
};

rsproto.flush = function() {
	var self = this;
	return new Promise(async (resolve, reject) => {
		try {
			var keys = await MAIN.redisclient.keys(self.name + ':*');
			if (keys.length === 0) return resolve();
			await MAIN.redisclient.del(keys);
			resolve();
		} catch (err) {
			console.error("Error flushing Redis keys:", err);
			reject(err);
		}
	});
};

rsproto.search = function(field, value) {
	var self = this;
	return new Promise(async (resolve) => {
		try {
			var results = await MAIN.redisclient.json.get(self.name + ':all', {
				path: `$[?(@.${field}=="${value}")]`
			});
			resolve(results || []);
		} catch (err) {
			console.error("Error searching in RedisJSON:", err);
			resolve([]);
		}
	});
};

rsproto.setVector = function(k, vector, metadata = {}) {
	var self = this;
	return new Promise(async (resolve, reject) => {
		try {
			await MAIN.redisclient.json.set(self.name + ':' + k, '$', { vector, metadata });
			await MAIN.redisclient.expire(self.name + ':' + k, self.ttl);
			resolve();
		} catch (err) {
			console.error("Error storing vector:", err);
			reject(err);
		}
	});
};

rsproto.searchVector = function(queryVector, topK = 5) {
	var self = this;
	return new Promise(async (resolve) => {
		try {
			var results = await MAIN.redisclient.ft_search(
				self.name,
				`*=>[KNN ${topK} @vector $vec AS score]`,
				{
					PARAMS: { vec: JSON.stringify(queryVector) },
					SORTBY: 'score',
					DIALECT: 2
				}
			);
			resolve(results || []);
		} catch (err) {
			console.error("Error searching vector:", err);
			resolve([]);
		}
	});
};



// Initialize the recommendation store
MAIN.recommendationStore = new REDIS_STORE('recommendations/3600'); // 1-hour TTL

// Initialize user behavior tracking store
MAIN.userBehaviorStore = new REDIS_STORE('user_behaviors/86400');