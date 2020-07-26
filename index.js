const fs = require('fs');
const Hapi = require('@hapi/hapi');
const Disk = require('catbox-disk');

let appPath = process.argv[2] || '';

if(!fs.existsSync(`/tmp/hapi`)){
	fs.promises.mkdir(`/tmp/hapi`, { recursive: true });
}

const server = Hapi.server(
	{
		port: 9230,
	    state: {
            strictHeader: false,
            clearInvalid: true
        },
        cache: [
		    {
		        name      : 'diskCache',
		        engine    : new Disk({
			        cachePath: '/tmp/hapi',
			        cleanEvery: 3600000,
			        partition : 'cache'
		        })
		    }
		]
	}
);
(async () => {
	await server.register([
		//加载session插件
		{
			plugin: require('hapi-server-session'),
			options: {
				name: 'sid',
				cookie: {
					ttl: 365 * 24 * 60 * 60 * 1000,
					path: '/',
					isSecure: false
				}
			}
		},
		//加载exchange插件
		{
			plugin: require('./lib/exchange'),
			options: {
				apps: ['./plugin', appPath]
			}
		}
	]);
    await server.start();
    console.log(`服务启动: ${server.info.uri}`);
})();