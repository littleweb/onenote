const axios = require('axios');
module.exports = app => {
	app.curl = app.axios = axios;
}