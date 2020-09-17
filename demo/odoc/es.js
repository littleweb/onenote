// docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.9.1
// curl -X PUT "localhost:9200/onedoc" -H 'Content-Type: application/json' -d'
// {
//   "mappings": {
//     "properties": {
//       "data": {
//         "type": "nested" 
//       }
//     }
//   }
// }
// '
const moment = require('moment');
const elasticsearch = require('elasticsearch');
const ES = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace',
  apiVersion: '7.2'
});
// ES.indices.putMapping({
//   index: 'onedoc',
//   id: 'one',
//   body: {
//     "properties": {
//       "data": {
//         "type": "nested" 
//       }
//     }
//   }
// }, () => {
  ES.exists({
    index: 'onedoc',
    id: 'one'
  }, function(error, exists){
    if(!exists){
      //新建立初始化文档
      ES.index({
        index: 'onedoc',
        id: 'one',
        body: {
          "_": {
            "ctime": moment(Date.now()).format(),
            "utime": moment(Date.now()).format()
          },
          "data": [
            {
              "id": 'id',
              "text": 'text',
              // 浮点
              "float": 0.01,
              // 长整型
              "long": 1000000,
              "date": moment(Date.now()).format()
            },
            {
              "id": 'id',
              "text": 'text',
              // 浮点
              "float": 0.01,
              // 长整型
              "long": 1000000,
              "date": moment(Date.now()).format()
            }
          ]
        }
      }, function(error, response){
        if(!error){
          console.log('onedoc ok');
        }
      });
    }
  });
// });
module.exports = function(app){
  this.save = async (data) => {
    let tempData = {};
    for(let key in data){
      if(key != '_'){
        tempData[key] = data[key];
      }
    }
    let records = app.odoc.flatten(app, tempData);
    let doc = {
      _: {
        ctime: moment(Date.now()).format(),
        utime: moment(Date.now()).format(),
        ...data._
      },
      data: records,
      value: tempData
    };
    let result = await ES.index({
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
    console.log(dsl);
    let result = await ES.search({
      index: 'onedoc',
      body: dsl
    });
    return result; 
  }
  return this;
}