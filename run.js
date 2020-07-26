#!/usr/bin/env node

const pm2 = require('pm2');
var args = require('yargs').argv;
let appPath = args.app || '';
let online = args._.indexOf('online') > -1?' online':'';
pm2.connect(function(err) {
	pm2.start({
		watch: [appPath],
		script    : 'index.js',     // Script to be run
		exec_mode : 'cluster',       // Allows your app to be clustered
		instances : 1, // Optional: Scales your app by 4
		args: `${appPath}${online}`,           
		max_memory_restart : '100M' // Optional: Restarts your app if it reaches 100Mo

	},function(err, apps) {
		pm2.disconnect();   // Disconnects from PM2
		if (err) throw err
	});
});