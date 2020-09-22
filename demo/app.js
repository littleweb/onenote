module.exports = ({app}) => {
	app.get('/', ctx => {
		return 'haha';
	});
	app.get('/guid', ctx => {
		return app.service.guid();
	});
	app.get('/json', ctx => {
		return app.model;
	});
	app.get('/redis', ctx => {
		return app.redis();
	});
}