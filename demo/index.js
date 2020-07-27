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
	app.get('/curl', async ctx => {
		let data = await app.curl('https://od.sh-d.com/D883F318EF46003A4');
		return data.data;
	});
	app.get('/guid', async ctx => {
		return app.guid();
	});
	app.get('/mongo', async ctx => {
		app.mongo.model.userInfo = {};
		return 'mongo';
	});
}