module.exports = ({app}) => {
  app.get('/data', ctx => {
    let data = app.odoc.onedoc.data;
    return app.odoc.es.flatten({data});
  });
  app.get('/src', ctx => {
    let data = app.odoc.onedoc.data;
    return app.odoc.es.flatten({data, type: false});
  });
  app.get('/srcdata', ctx => {
    let data = app.odoc.onddoc.src;
    return app.odoc.es.flatten({data, type: false});
  });
  app.get('/remove', async ctx => {
    let odoc = app.odoc.es.es(app);
    await odoc.remove(ctx.get.id);
    return 'ok';
  });
}