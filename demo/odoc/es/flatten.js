const typeco = require('typeco');
const moment = require('moment');

module.exports = ({data, type = true}) => {
  const flatten = function(data) {
      var result = {};
      function recurse (cur, prop) {
          if (Object(cur) !== cur) {
              result[prop] = cur;
          } else if (Array.isArray(cur)) {
            let isFlat = cur.filter(item => typeof(item) != 'string').length > 0?false:true;
            if(isFlat){
              result[prop] = cur;
            }else{
              for(var i=0, l=cur.length; i<l; i++){
                recurse(cur[i], prop + "[" + i + "]");
              }
            }
            if (l == 0){
              result[prop] = [];
            }
          } else {
              var isEmpty = true;
              for (var p in cur) {
                  isEmpty = false;
                  recurse(cur[p], prop ? prop+"."+p : p);
              }
              if (isEmpty && prop)
                  result[prop] = {};
          }
      }
      recurse(data, "");
      return result;
  }
  const unflatten = function(data) {
      "use strict";
      if (Object(data) !== data || Array.isArray(data))
          return data;
      var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
          resultholder = {};
      for (var p in data) {
          var cur = resultholder,
              prop = "",
              m;
          while (m = regex.exec(p)) {
              cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
              prop = m[2] || m[1];
          }
          cur[prop] = data[p];
      }
      return resultholder[""] || resultholder;
  };
  if(type){
    let pdata = flatten(data);
    let esdata = [];
    for(let id in pdata){
      // 第一步：检测数字
      let value = pdata[id] - 0;
      let type = 'text';
      if(typeco.isNumber(value)){
        type = 'long';
        // 如果是浮点，则强制转换成text
        if(value%1 !=0){
          type = 'float';
        }
      }else{
        value = pdata[id];
        try{
          if(typeco.isString(value) && moment(value).isValid()){
            type = 'date';
            value = moment(value).format()
          }
        }catch(e){}
      }
      // 第二步：检测日期
      if(type == 'long' && (String(value).length == 13)){
        if(moment(value).isValid()){
          type = 'date';
        }
      }
      // 过滤空对象
      if(typeco.isObject(value)){
        value = "";
      }
      if(typeco.isArray(value)){
        type = 'array';
      }
      // console.log(type, value);
      // 数据类型判断
      // date: 时间类型
      esdata.push({
        id,
        type: type,
        [type]: value,
        ...{src: `|${String(pdata[id])}`}
      });
    };
    return esdata;
  }else{
    return unflatten(data);
  }
}