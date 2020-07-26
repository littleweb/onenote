# onemin: 一分钟就可以上手的nodejs框架

## 一、安装、使用、配置

### 安装

```
npm i onemin -g
```

### 使用

> onemin默认使用0配置，0依赖方式启动

1、创建

`index.js`
```
module.exports = app => {
	app.get('/', ctx => {
		return "hello word";
	});
}
```

2、启动

本机环境
```
//开发模式
onemin

//上线模式
onemin online

//指定路径
onemin --app=demo
```

docker环境
```
docker run -it -p 9230:9230 -v /$PWD:/app libinzhang/onemin onemin
```

docker-compose.yml
```
version: '2'
services:
  one-nginx:
    image: libinzhang/onemin
    container_name: onemin
    restart: always
    volumes:
      - "$PWD:/app"
    ports:
      - 9230:9230
    network_mode: host
```

3、访问

```
http://localhost:9230
```

### 配置

> onemin虽然支持0配置，也支持配置文件的设定，开发者可通过config.js|.json进行项目的配置

开发模式

```
//config.js

exports = {
	"name": "项目名称",
	"port": 9230,//项目端口
}
```
线上模式

```
//config.online.js

exports = {
	"name": "项目名称",
	"port": 9230,//项目端口
}
```

## 二、路由、业务、事件

### 路由

支持常用路由method：get、post、put、patch、delete，onemin路由通过return进行内容输出。

一些实例

1、get

```
module.exports = app => {
	app.get('/', ctx => {
		let query = ctx.get;
		return query;
	});
}
```
2、post

```
module.exports = app => {
	app.get('/', ctx => {
		let data = ctx.post;
		return data;
	});
}
```
3、form：get和post混合模式

`ctx.form等于ctx.get+ctx.post的混合值，也可以单独取`

```
module.exports = app => {
	app.get('/', ctx => {
		let data = ctx.form;
		return data;
	});
}
```

### CTX上下文

ctx是每个路由的上下文变量，可以获取和设置请求的相关属于和内容。

- get参数：`ctx.get`
- post参数：`ctx.post`
- form参数：`ctx.form`
- headers：`ctx.headers`
- 客户信息：`ctx.ua`
- session：`ctx.session`
- cookie：`ctx.cookie`
- IP：`ctx.ip`
- host：`ctx.host`
- 域名：`ctx.domain`
- url地址：`ctx.url`
- referrer：`ctx.referrer`
- 状态码：`ctx.status = 200`
- 下载文件：`return ctx.file('文件路径')`


## 三、cookie、session

cookie

```
module.exports = app => {
	//设置cookie
	app.get('/', ctx => {
		ctx.cookie('did', "did");
		return 'ok';
	});
	//获取cookie
	app.get('/', ctx => {
		let did = ctx.cookie('did');
		return did;
	});
}
```

session

```
module.exports = app => {
	//设置session
	app.get('/', ctx => {
		ctx.session.userInfo = 'userInfo';
		return 'ok';
	});
	//获取session
	app.get('/', ctx => {
		let userInfo = ctx.session.userInfo;
		return userInfo;
	});
}
```

## 四、数据库、缓存

### 数据

1、mongo

```
module.exports = app => {
	//读取
	app.get('/', ctx => {
		let userList = await app.mongo.User.list();
		return userList;
	});
}
```

```
module.exports = app => {
	app.mongo.model('model', {
		//建立字段表结构
		fieldMap: {
			user_name: {type: String, default: "", name: "用户名"},
			nick_name: {type: String, default: "", name: "昵称"},
			status: {type: String, default: "", name: "状态"}			
		},
		//创建独立方法
		methods: {
			getByUsername(user_name){
				return new Promise(function(resolve, reject){
					model.db.find({user_name},{},function(err, data){
						err && reject(err);
						resolve(data[0]);
					});
				});				
			}
		}
	});
};
```

## 五、模板、前端

```
module.exports = app => {
	//模板渲染
	app.get('/', ctx => {
		let data = ctx.data;
		return ctx.tpl('tpl路径', data);
	});
}
```

## 六、静态资源

```
module.exports = app => {
	//读取文件
	app.get('/', ctx => {
		return ctx.file('文件路径');
	});
	//设置资源目录
	app.get('/static', ctx => {
		return ctx.static('目录路径');
	});
}
```

## 七、登录、验证

## 八、日志、监控、测试

日志

```
module.exports = app => {
	//记录日志
	app.get('/log', ctx => {
		//字符形式
		app.log('tag', 'data');
		//数组对象形式
		app.log(['tag','tag2'], {data: 'data'});
		return 'ok';
	});
}
```

## 九、插件、工具

### 插件

> onemin的插件和普通应用没有太大的区别，每一个可执行的js文件都可以成为插件，有路由代码即可成为路由插件，直接挂载在app的方法即可成为方法和工具插件，在各类事件点加入运行时处理逻辑即可成为运行时插件。通过发布独立npm，然后通过config进行引用即可使用插件。

### 工具

1、网络请求：axios

onemin内置axios做为httpClient，可直接通过app.curl或app.axios来调用。

```
module.exports = app => {
	app.get('/curl', async ctx => {
		let data = await app.curl('url');
		return data;
	});
};
```

2、定时任务：timer

```
module.exports = app => {
	//设置一个定时任务
	app.timer('timerid', {
		name: "一个任务",
		time: 60,//单位秒
		task: async () => { //任务

		}
	});
	//修改一个定时任务，value部分会进行覆盖和混合
	app.timer('timerid', {
		name: "一个任务",
		time: 60,//单位秒
		task: async () => { //任务

		}
	});
	//获取一个定时任务
	let timer = app.timer('timerid');
	//获取所有定时任务
	let timerList = app.timer.list();
	//删除一个定时任务
	app.timer('timerid').remove();
};
```

## 十、应用案例
