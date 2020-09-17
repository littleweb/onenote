const moment = require('moment');

module.exports = app => {
  app.get('/', ctx => {
    return "es";
  });
  app.get('/data', ctx => {
    return app.odoc.flatten(app, app.odoc.data);
  });
  app.get('/src', ctx => {
    return app.odoc.flatten(app, app.odoc.data, false);
  });
  app.get('/log', async ctx => {
    let odoc = app.odoc.es(app);
    let hits = app.odoc.datax.log.responses[0].hits.hits;
    let data = hits.map(item => {
      let src = item._source;
      src.data = JSON.parse(src.data);
      src._ = {
        pid: 'onelog',
        tid: 'onelog'
      }
      return src;
    });
    for(let i=0;i<data.length;i++){
      await odoc.save(data[i]);
    }
    return data;
  });
  app.get('/srcdata', ctx => {
    return app.odoc.flatten(app, app.odoc.src, false);
  });
  // 存储
  app.get('/save', async ctx => {
    let odoc = app.odoc.es(app);
    let doc = app.odoc.logdata;
    doc._ = {
      pid: 'onelog',
      tid: 'onelog'
    };
    let result = await odoc.save(doc);
    return result;
  });
  app.get('/time', ctx => {
    return {
      0: moment('8.1.0').format(),
      1: moment('8.1.0').isValid(),
    }
  });
  app.get('/dsl', async ctx => {
    let odoc = app.odoc.es(app);
    let result = {};
    {
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              "city" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "data.地区信息.city"
                  }
                },
                "aggs" : {
                  "keyword" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              }
            }
          }
        }
      };
      let _result = await odoc.dsl(dsl);
      result['城市'] = _result.aggregations.data.city.keyword.buckets;
    }
    {
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              "city" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "data.地区信息.isp"
                  }
                },
                "aggs" : {
                  "keyword" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              }
            }
          }
        }
      };
      let _result = await odoc.dsl(dsl);
      result['运营商'] = _result.aggregations.data.city.keyword.buckets;
    }
    {
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              "city" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.browser.name"
                  }
                },
                "aggs" : {
                  "keyword" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              }
            }
          }
        }
      };
      let _result = await odoc.dsl(dsl);
      result['浏览器'] = _result.aggregations.data.city.keyword.buckets;
    }
    {
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              "city" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.os.name"
                  }
                },
                "aggs" : {
                  "keyword" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              }
            }
          }
        }
      };
      let _result = await odoc.dsl(dsl);
      result['操作系统'] = _result.aggregations.data.city.keyword.buckets;
    }
    {
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              "city" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.device.vendor"
                  }
                },
                "aggs" : {
                  "keyword" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              }
            }
          }
        }
      };
      let _result = await odoc.dsl(dsl);
      result['设备'] = _result.aggregations.data.city.keyword.buckets;
    }
    return result;
  });
  app.get('/remove', async ctx => {
    let odoc = app.odoc.es(app);
    await odoc.remove(ctx.get.id);
    return 'ok';
  });
}