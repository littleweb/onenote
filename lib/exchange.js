const PATH = require('path');
const fs = require('fs');
const moment = require("moment");
const mime = require("mime");
const ALY = require('aliyun-sdk');
const oss = (md5, filename, oss) => {
	const ossStream = require('aliyun-oss-upload-stream')(new ALY.OSS(oss.key));
	let ext = PATH.extname(filename);
	let name = md5 + ext;
	let date = moment().format('YYYY-MM-DD');
	let upload = ossStream.upload({
		Bucket: oss.bucket,
		Key: `upload/images/${date}/${name}`,
		ContentType: mime.getType(name)
	});
	upload.minPartSize(1024*1024*2);
	return {name,upload};
};

exports.plugin = {
	name: "onemin",
	version: "1.0.0",
	register: async function(server, options){
		let method = function(_method, path, fn){
			path = path.replace('index/','');
			let key = `${_method}::${path}`;
			global.RS = global.RS || {};
			if(!global.RS[key]){
				global.RS[key] = key;
				server.route({
					method: _method,
					path: path,
					config: {
						cors: {
							origin: ['*'],
							additionalHeaders: ['cache-control', 'x-requested-with']
						},
						handler: function(req,h){
							let result = '';
							let ctx = {};
								ctx.headers = req.headers;
								ctx.params = req.params || {};
								ctx.get = req.query?JSON.parse(JSON.stringify(req.query)):null;
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
							ctx.jump = (url) => {
								return h.redirect(url);
							};
							// ctx.status = 200;
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
							}else{
								return result;
							}
						},
					}
				});
			}
		};
		let APP = {
			server: server,
			load: function(item, appPath) {
				let _app = {
					// load,
					url: [],
					get(url,fn){
						let path = item.replace(appPath,'').replace(PATH.extname(item),'') + url;
						method('get', path, fn);
					},
					post(url,fn){
						let path = item.replace(appPath,'').replace(PATH.extname(item),'') + url;
						method('post', path, fn);
					},
					oss(url, fn, ossConfig){
						server.route({
							method: 'post',
							path: '/oss',
							config: {
							  cors: {
								origin: ['*'],
								additionalHeaders: ['cache-control', 'x-requested-with']
							  },
							  payload:{
								maxBytes: (1024*1024*10),
								output:'stream',
								parse: true,
								multipart: true,
								allow: 'multipart/form-data'
							  },
							  handler: async function(req,h){
								let post = req.payload;
								let field = post.field || 'image';
								let md5 = `F${Date.now()}${String(Math.floor(Math.random()*1000000)).substr(0,6)}`;
								let upload = oss(md5, post[field].hapi.filename,ossConfig);
								console.log(upload);
								 let wresult = await post[field].pipe(upload.upload);
								 let date = moment().format('YYYY-MM-DD');
								  return ({
									  name: upload.name,
									  url: `/upload/images/${date}/${upload.name}`
								  });
							  },
							}
						});
					},
					upload(url, fn){
						let path = item.replace(appPath,'').replace(PATH.extname(item),'') + url;
						path = path.replace('index/','');
						server.route({
							method: 'post',
							path: path,
							config: {
								cors: {
									origin: ['*'],
									additionalHeaders: ['cache-control', 'x-requested-with']
								},
								payload:{
									maxBytes: (1024*1024*10),
									output:'stream',
									parse: true,
									multipart: true,
									allow: 'multipart/form-data'
								},
								handler: async function(req,h){
									let post = req.payload;
									let uploadPath = '/tmp/odoc/upload'
									if(!fs.existsSync(uploadPath)){
										fs.mkdirSync(uploadPath);
									}
									let field = post.field || 'image';
									let md5 = `F${Date.now()}${String(Math.floor(Math.random()*1000000)).substr(0,6)}`;
									await post[field].pipe(fs.createWriteStream(`${uploadPath}/${md5}${PATH.extname(post[field].hapi.filename)}`));
									return {
										name: md5,
										url: md5 + PATH.extname(post[field].hapi.filename)
									};
								},
							}
						});
						server.route({
							method: 'get',
							path: `${path}/{param*}`,
							config: {
								//解析400错误
								// state: {
								// 	parse: false,
								// 	failAction: 'ignore'
								// },
								handler: {
									directory: {
										path: '/tmp/odoc/upload',
										listing: true
									}
								}
							}
						});
					}
				};
				APP = {...APP, ..._app};
				// _app = Object.assign(APP, _app);
				if(!(item.indexOf('package') > -1)){
					let route = require(item);
					typeof(route) == 'function' && route({app:APP});
				}
			}
		};
		let load = function(appPath){
			APP[appPath] = appPath;
			appPath = PATH.resolve(appPath);
			let fileList = require('rd').readFileSync(appPath);
			fileList = fileList.filter(item => !(item.indexOf('.DS_Store') > -1));
			//生成app调用链
			fileList.forEach(item => {
				if(!(item.indexOf('webpack') > -1) && !(item.startsWith('.')) && !(item.indexOf('node_modules') > -1) && !(item.indexOf('web') > -1) && !(item.indexOf('package') > -1) ){
					if(PATH.extname(item) == '.js' || PATH.extname(item) == '.json'){
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
						let code = require(item);
						// key = key.replace('.index','');
						if(key){
							eval(`
								APP${key} = code;
							`);
						}
					}
				}
			});

			//适配处理路由链
			let urls = [];
			fileList.forEach(item => {
				if(PATH.extname(item) == '.js'){
					if(!(item.indexOf('web') > -1) && !(item.indexOf('package') > -1) && !(item.indexOf('node_modules') > -1)){
						APP.load(item, appPath);
					}
				}else{
					server.route({
						method: 'GET',
						path: item.replace(appPath,''),
						handler: function (request, h) {
							return h.file(item);
						}
					});
				}
			});
		}
		options.apps.forEach(item => {
			load(item);
		});
	}
} 