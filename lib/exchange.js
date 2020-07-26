const PATH = require('path');

exports.plugin = {
	name: "onepp",
	version: "1.0.0",
	register: async function(server, options){
		let APP = {
			server: server
		};
		let method = function(path, fn){
			server.route({
			    method: "GET",
			    path: path.replace('index/',''),
			    handler: function(req,h){
			    	let result = '';
			    	h.text = (text) => {
			    		result = text;
			    	};
			    	let ctx = {};
					ctx.headers = req.headers;
					ctx.get = req.query || {};
				    ctx.post = req.payload || {};
				    ctx.form = Object.assign(ctx.get, ctx.post);
				    ctx.session = req.session;
				    ctx.cookie = function(key, value){
				    	if(key && value){
				    		if(!req.state[key]){
					    		server.state(key, {
								    ttl: null,
								    isSecure: false,
								    isHttpOnly: true,
								    // encoding: 'base64json',
								    clearInvalid: false,
								    strictHeader: true
								});
				    		}
							h.state(key, value);
				    	}else{
				    		return req.state[key];
				    	}
				    };
				    ctx.ip = req.headers['x-real-ip'] || req.info.remoteAddress;
				    ctx.host = req.info.host;
				    ctx.hostname = req.info.hostname;
				    ctx.domain = req.info.hostname;
				    ctx.referrer = req.info.referrer;
				    ctx.url = req.url.href;
				    //将_vars并入request
				    // ctx = Object.assign(req, ctx);
				    // ctx.ua = require('ua-parser-js')(request.headers['user-agent']);
				    ctx.data = req.data || {};
				    // ctx.data = Object.assign(req.data, ctx);
				    // console.log(ctx);
			    	// return fn(ctx,h);
			    	result = fn(ctx, h);
			    	if(ctx.status){
			    		return h.response(result).code(ctx.status);
			    	}
			    	return result;
			    }
			});
		};
		let load = function(appPath){
			appPath = PATH.resolve(appPath);
			let fileList = require('rd').readFileSync(appPath);

			//生成app调用链
			fileList.forEach(item => {
				let keys = item.replace(appPath,'').split('/');
				let key = '';
				keys.forEach(kitem => {
					if(kitem){
						let kkey = PATH.basename(kitem, PATH.extname(kitem));
						key = key + '.' + kkey;
						// key = key.replace('.index','');
						eval(`
							APP${key} = APP${key} || {};
						`);
					}
				});
				item = require(item);
				key = key.replace('.index','');
				if(key){
					eval(`
						APP${key} = item;
					`);
				}
			});

			//适配处理路由链
			let urls = [];
			fileList.forEach(item => {
				if(PATH.extname(item) == '.js'){
					let _app = {
						url: [],
						get(url,fn){
							let path = item.replace(appPath,'').replace(PATH.extname(item),'') + url;
							method(path, fn);
						},
						post(url,fn){
						let path = item.replace(appPath,'').replace(PATH.extname(item),'') + url;
							method(url, fn);
						}
					};
					_app = Object.assign(APP, _app);
					let route = require(item);
					route(_app);
				}
			});
		}
		options.apps.forEach(item => {
			load(item);
		});
	}
} 