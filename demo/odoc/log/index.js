module.exports = ({app}) => {
  app.get('/log', async ctx => {
    let odoc = app.odoc.es.es(app);
    let hits = app.odoc.log.log.responses[0].hits.hits;
    let data = hits.map(item => {
      let src = item._source;
      src.data = JSON.parse(src.data);
      src._ = {
        pid: 'onelog',
        tid: 'onelog'
      }
      return src;
    });
    let result;
    for(let i=0;i<data.length;i++){
      // if(i === 1){
        result = await odoc.save(data[i]);
      // }
    }
    return result;
  });
  // 存储
  app.get('/save', async ctx => {
    let odoc = app.odoc.es.es(app);
    let doc = app.odoc.log.logdata;
    doc._ = {
      pid: 'onelog',
      tid: 'onelog'
    };
    let result = await odoc.save(doc);
    return result;
  });
  // 分组聚合
  app.get('/aggs/term', async ctx => {
    let odoc = app.odoc.es.es(app);
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
              "城市分布" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "data.地区信息.city"
                  }
                },
                "aggs" : {
                  "城市" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              },
              "ISP运营商" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "data.地区信息.isp"
                  }
                },
                "aggs" : {
                  "ISP" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              },
              "浏览器分布" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.browser.name"
                  }
                },
                "aggs" : {
                  "浏览器" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              },
              "操作系统" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.os.name"
                  }
                },
                "aggs" : {
                  "系统" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    }
                  }
                }
              },
              "设备分布" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "up.ua.device.vendor"
                  }
                },
                "aggs" : {
                  "设备" : {
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
      result = _result.aggregations.data;
    }
    return result;
  });
  // 多维聚合
  app.get('/aggs/term/many', async ctx => {
    let odoc = app.odoc.es.es(app);
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
              // 
              "城市分布" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "data.地区信息.city"
                  }
                },
                "aggs" : {
                  "城市" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    },
                    "aggs": {
                      "其他维度" : {
                        "reverse_nested": {},
                        "aggs": {
                          "操作系统" : {
                            "nested": {
                                "path": "data"
                            },
                            "aggs": {
                              "操作系统": {
                                "filter" : {
                                  "term" : {
                                    "data.id.keyword" : "up.ua.os.name"
                                  }
                                },
                                "aggs" : {
                                  "设备" : {
                                    "terms" : {
                                      "field" : "data.text.keyword",
                                      "size": 20
                                    }
                                  }
                                }
                              }
                            }
                          },
                          "手机设备" : {
                            "nested": {
                                "path": "data"
                            },
                            "aggs": {
                              "操作系统": {
                                "filter" : {
                                  "term" : {
                                    "data.id.keyword" : "up.ua.device.vendor"
                                  }
                                },
                                "aggs" : {
                                  "设备" : {
                                    "terms" : {
                                      "field" : "data.text.keyword",
                                      "size": 20
                                    }
                                  }
                                }
                              }
                            }
                          },
                        },
                      }
                    }
                  },
                }
              }
            }
          }
        }
      };
      result = await odoc.dsl(dsl);
    }
    return result;
  });
  // 多维聚合 - 模板化
  app.get('/aggs/term/tpl', async ctx => {
    let odoc = app.odoc.es.es(app);
    let model = {
      name: "城市分布",
      id: "data.地区信息.city",
      next: [
        {
          name: "操作系统",
          id: "up.ua.os.name"
        },
        {
          name: "手机设备",
          id: "up.ua.device.vendor"
        }
      ]
    };
    let query;
    {
      let next = {};
      model.next.forEach(item => {
        next[item.name] = {
          "nested": {
              "path": "data"
          },
          "aggs": {
            [item.name]: {
              "filter" : {
                "term" : {
                  "data.id.keyword" : item.id
                }
              },
              "aggs" : {
                [item.name] : {
                  "terms" : {
                    "field" : "data.text.keyword",
                    "size": 20
                  }
                }
              }
            }
          }
        }
      });
      let dsl = {
        "size": 0,
        "aggs" : {
          "data" : {
            "nested" : {
              "path" : "data"
            },
            "aggs" : {
              [model.name] : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : model.id
                  }
                },
                "aggs" : {
                  [model.name] : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    },
                    "aggs": {
                      "next" : {
                        "reverse_nested": {},
                        "aggs": next
                      }
                    }
                  },
                }
              }
            }
          }
        }
      };
      query = await odoc.dsl(dsl);
    }
    let result = [];
    query.aggregations.data[model.name][model.name].buckets.forEach(item => {
      let ditem = {
        key: item.key,
        doc_count: item.doc_count,
        list: []
      };
      model.next.forEach(nitem => {
        ditem.list.push({
          key: nitem.name,
          count: item.next[nitem.name][nitem.name].doc_count,
          list: item.next[nitem.name][nitem.name][nitem.name].buckets
        });
      });
      result.push(ditem);
    });
    return result;
  });
  app.get('/remove', async ctx => {
    let odoc = app.odoc.es(app);
    await odoc.remove(ctx.get.id);
    return 'ok';
  });
}