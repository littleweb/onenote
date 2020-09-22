const axios = require('axios');
const moment = require('moment');

module.exports = ({app}) => {
  app.get('/', async ctx => {
    let list = await axios.get('https://mis.lcyff.com/api/doc/fti:didi_product_order/list?pn=1&size=1000&sort=desc');
    list = list.data.data.list;
    list = list.map(item => {
      let time = item.meta._status.create_time;
      let order = item.content.order;
      order.time = time;
      return order;
    });
    let rlist = [];
    for(let i = 0;i<list.length;i++){
      let pdoc = JSON.parse(list[i].skuList);
      for(let si = 0;si < pdoc.length;si++){
        let spdoc = await axios.get(`https://mis.lcyff.com/${pdoc[si].skuId}`);
        spdoc = spdoc.data.doc.content.procut;
        delete list[i].skuList;
        // list[i].time = moment(new Date(list[i].time)).format();
        rlist.push({
          ...list[i],
          product: {
            name: spdoc.number,
            price: spdoc.price,
            beizhu: spdoc.beizhu,
            brandName: spdoc.brandName,
            didiPrice: spdoc.didiPrice,
          }
        });
      }
    }
    let docs = [];
    rlist.forEach(item => {
      docs.push({
        _: {
          ctime: item.time
        },
        ...item
      });
    });
    let odoc = app.odoc.es.es({app});
    for(let i = 0;i < docs.length; i++){
      await odoc.save(docs[i]);
    }
    return docs[0];
  });
  // 多维聚合 - 模板化
  app.get('/aggs/term', async ctx => {
    let odoc = app.odoc.es.es({app});
    let model = {
      name: "商品",
      id: "product.name",
      next: [
        {
          name: "品牌",
          id: "product.brandName"
        },
        {
          name: "备注",
          id: "product.beizhu"
        }
      ]
    };
    let result = await odoc.aggs.term({model});
    return {result};
  });
  app.get('/aggs/term/city', async ctx => {
    let odoc = app.odoc.es.es({app});
    let model = {
      name: "城市",
      id: "city",
      next: [
        {
          name: "商品",
          id: "product.name"
        },
        {
          name: "品牌",
          id: "product.brandName"
        },
        {
          name: "备注",
          id: "product.beizhu"
        }
      ]
    };
    let result = await odoc.aggs.term({model});
    return {result};
  });
  app.get('/aggs/term/city/sum', async ctx => {
    let odoc = app.odoc.es.es({app});
    let model = {
      name: "城市",
      id: "city",
      list: [
        {
          name: "销售额",
          id: "product.price",
          type: "sum"
        },
        {
          name: "最高价格",
          id: "product.price",
          type: "max"
        },
        {
          name: "最低价格",
          id: "product.price",
          type: "min"
        }
      ]
    };
    let result = await odoc.aggs.term({model});
    return {result};
  });
  app.get('/aggs/term/sum', async ctx => {
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
              "城市" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "city"
                  }
                },
                "aggs" : {
                  "城市" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    },
                    "aggs": {
                      "other" : {
                        "reverse_nested": {},
                        "aggs": {
                          "其他数据" : {
                            "nested": {
                                "path": "data"
                            },
                            "aggs": {
                              "销售金额": {
                                "filter" : {
                                  "term" : {
                                    "data.id.keyword" : "product.price"
                                  }
                                },
                                "aggs" : {
                                  "销售总额" : {
                                    "sum" : {
                                      "field" : "data.long"
                                    }
                                  },
                                  "平均价格" : {
                                    "avg" : {
                                      "field" : "data.long"
                                    }
                                  },
                                  "最高价格" : {
                                    "max" : {
                                      "field" : "data.long"
                                    }
                                  },
                                  "最低价格" : {
                                    "min" : {
                                      "field" : "data.long"
                                    }
                                  }
                                }
                              }
                            },
                          }
                        }
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
  app.get('/aggs/his', async ctx => {
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
              "价格" : {
                "filter" : {
                  "term" : {
                    "data.id.keyword" : "city"
                  }
                },
                "aggs" : {
                  "城市" : {
                    "terms" : {
                      "field" : "data.text.keyword",
                      "size": 20
                    },
                    "aggs": {
                      "other" : {
                        "reverse_nested": {},
                        "aggs": {
                          "其他数据" : {
                            "nested": {
                                "path": "data"
                            },
                            "aggs": {
                              "价格": {
                                "filter" : {
                                  "term" : {
                                    "data.id.keyword" : "product.price"
                                  }
                                },
                                "aggs": {
                                  "价格": {
                                    "histogram" : {
                                      "field" : "data.long",
                                      "interval": 100
                                    },
                                    "aggs": {
                                      "商品列表": {
                                        "reverse_nested": {},
                                        "aggs": {
                                          "商品": {
                                            "nested": {
                                                "path": "data"
                                            },
                                            "aggs": {
                                              "商品": {
                                                "filter" : {
                                                  "term" : {
                                                    "data.id.keyword" : "product.name"
                                                  }
                                                },
                                                "aggs": {
                                                  "商品": {
                                                    "terms": {
                                                      "field": "data.text.keyword"
                                                    }
                                                  }
                                                }  
                                              }
                                            }                                          
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            },
                          }
                        }
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
}