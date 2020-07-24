module.exports = app => {
	app.get('/', ctx => {
		return app.service.guid();
	});
	app.get('/get', ctx => {
		return ctx.get;
	});
	app.get('/ctx', ctx => {
		ctx.cookie('oid', 'oid');
		ctx.session.views = ctx.session.views + 1 || 1;
		ctx.oid = ctx.cookie('oid');
		return ctx;
	});
	app.get('/code', ctx => {
		ctx.status = 403;
		return '未登录';
	});
}