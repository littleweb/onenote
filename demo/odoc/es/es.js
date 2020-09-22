// docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.9.1
const moment = require('moment');
const elasticsearch = require('elasticsearch');
const ES = new elasticsearch.Client({
  host: 'localhost:9200',
  // log: 'trace',
  apiVersion: '7.2'
});
(async () => {
  // 创建索引
  ES.exists({
    index: 'onedoc',
    id: 'one'
  }, async function(error, exists){
    if(!exists){
      //新建立初始化文档
      ES.index({
        index: 'onedoc',
        id: 'one',
        body: {}
      });
      // 初始化类型
      await ES.indices.putMapping({
        index: 'onedoc',
        body: {
          "properties": {
            "data": {
              "type": "nested"
            }
          }
        }
      });
      // 初始化字段类型
      await ES.index({
        index: 'onedoc',
        id: 'one',
        body: {
          "_": {
            "ctime": moment(Date.now()).format(),
            "utime": moment(Date.now()).format()
          },
          "data": [
            {
              // 文本型
              "text": 'text',
              // 浮点型
              "float": 0.01,
              // 长整型
              "long": 1000000,
              // 日期型
              "date": moment(Date.now()).format(),
              // 一级字符串数组
              "array": ["a", "b", "c"]
            }
          ]
        }
      });
    }
  });  

})();
module.exports = function({app}){
  let me = this;
  this.save = async (data) => {
    let tempData = {};
    for(let key in data){
      if(key != '_'){
        tempData[key] = data[key];
      }
    }
    let records = app.odoc.es.flatten({data:tempData});
    let doc = {
      _: {
        ctime: moment(Date.now()).format(),
        utime: moment(Date.now()).format(),
        ...data._
      },
      data: records,
      // value: tempData
    };
    let result = doc;
    result = await ES.index({
      index: 'onedoc',
      body: doc
    });
    return result;
  };
  this.remove = async (id) => {
    await ES.delete({
      index: 'onedoc',
      id
    });
  }
  this.dsl = async dsl => {
    // console.log(dsl);
    let result = await ES.search({
      index: 'onedoc',
      body: dsl
    });
    return result; 
  }
  // 聚合
  this.aggs = {
    term: async ({model}) => {
      let next = {};
      const typeList = {
        "term": {
          "name": "terms",
          "type": "text.keyword"
        },
        "sum": {
          "name": "sum",
          "type": "long"
        },
        "avg": {
          "name": "avg",
          "type": "long"
        },
        "per": {
          "name": "percentiles",
          "type": "text.keyword"
        },
        "min": {
          "name": "min",
          "type": "long"
        },
        "max": {
          "name": "max",
          "type": "long"
        },
      };
      model.list.forEach(item => {
        let type = item.type || 'term';
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
                  [typeList[type].name] : {
                    "field" : `data.${typeList[type].type}`
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
      let query = await me.dsl(dsl);
      let result = [];
      query.aggregations.data[model.name][model.name].buckets.forEach(item => {
        let ditem = {
          key: item.key,
          doc_count: item.doc_count,
          list: []
        };
        model.list.forEach(nitem => {
          ditem.list.push({
            key: nitem.name,
            count: item.next[nitem.name][nitem.name].doc_count,
            list: item.next[nitem.name][nitem.name][nitem.name].buckets,
            value: item.next[nitem.name][nitem.name][nitem.name].value || 0
          });
        });
        result.push(ditem);
      });
      return {result,query:query.aggregations.data[model.name][model.name].buckets};
    }
  }
  return this;
}