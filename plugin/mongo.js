module.exports = app => {
	let mongo = {
		db: {},
		model: {}
	};
	let proxy = new Proxy(mongo,{
		get: function(target, key) {
	        console.log('getting '+key);
	        return target[key]; // 不是target.key
	    },
	    set: function(target, key, value) {
	        console.log('setting '+key);
	        target[key] = value;
	    }
	});
	app.mongo = proxy;
}