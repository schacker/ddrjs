/**
 * 路由，主要用于模块间跳转，一个应用中存在一个router，多个route，route节点采用双向链表存储
 * @author 		yanglei
 * @since 		1.0.0
 * @date		2017-01-21
 * @description	采用修改页面hash方式进行路由历史控制，每个route 可设置onEnter事件(钩子) 和 onLeave事件(钩子)
 */

(function(){
	/**
	 * Router 类
	 */
	var Router = function(config){
		var me = this;
		me.routes = [];					//存放路由
		me.history = [];				//历史 //修改hash中的module  www.abc.com/module1   www.abc.com/module2
		me.views = [];					// 保存路径和view
		me.root = config.root || '';	//根路径
		me.currentView = null;			//当前触发路由的view
		me.renderView = null;			//子路由渲染容器
		me.module = config.module;		//模块
		me.name = 'DDRouter_' + DD.genId();
		//初始化route列表
		if(DD.isArray(config.routes)){
			config.routes.forEach(function(r){
				me.add(r);
			});
		}

		//处理popstate事件
		window.addEventListener('popstate' , function(e){
			//删除当前view的activeClass
			if(me.currentView && me.currentView.$routeConfig['activeclass'] !== undefined){
				DD.removeClass(me.currentView,me.currentView.$routeConfig['activeclass']);
			}
			//根据state切换module
			var state = history.state;
			if(state !== null){
				me.start(state.path,me.views[state.path],false);
			}
		});

	}

	/**
	 * 初始化router view
	 */
	Router.initView = function(view){
		if(!view.$module.router){
			return;
		}
		//设置routerview
		view.$module.router.renderView = view;
		//设置routerview 标志
		view.$isRouter = true;
	}

	/**
	 * 路由器处理
	 */

	Router.prototype = {
		/**
		 * 启动指定路径的路由
		 * @param path 	路径
		 * @param view  route element
		 * @param pushFlag 是否pushFlag
		 */
		start:function(path,view,pushFlag){
			var me = this;

			//连续两次同一个路径不进行操作
			if(me.currentPath === path){
				return;
			}
			me.currentPath = path;
			
			var route = me.get(path);
			if(route === undefined){
				throw DD.Error.handle('notexist1',DD.words.route,path);
			}
			//更改样式
			if(DD.isEl(view) && view.$routeConfig['activeclass'] !== undefined){
				var cls = view.$routeConfig['activeclass'];
				// 删除currentView的activeClass
				if(me.currentView){
					DD.removeClass(me.currentView,cls);
				}
				DD.addClass(view,cls);
			}
			route.start(path,pushFlag);
			//保存当前点击view
			me.currentView = view;
			me.views[path] = view;
		},
		/**
		 * 添加路由
		 * @param config 	路由参数，参考Route定义
		 * @return 			新添加的route
		 */
		add:function(config){
			var me = this;
			config.router = me;
			var route = config;
			if(!(config instanceof Route)){
				route = DD.createRoute(config);
			}
			me.routes.push(route);
			return route;
		},

		/**
		 * 获取路由
		 * @parma path 	路径
		 * @return 返回找到的路由
		 */
		get:function(path){
			var me = this;
			for(var i=0;i<me.routes.length;i++){
				var route = me.routes[i];
				if(route.match(path)){
					return route;
				}
				// 递归查找
				if(DD.isArray(route.routes) && route.routes.length > 0){
					return me.get.call(route,path);
				}
			}
		}
	}

	

	/**
	 * Route 类
	 * @param config	路由参数对象
	 *			module: 模块名,
	 *			path: 	模块路径，可为空，用系统设置的模块根目录，如果不为空，则由模块根目录+设置的目录构成
	 *			routes: 子路由集合   
	 */
	var Route = function(config){
		var me = this;

		if(DD.isEmpty(config) || !DD.isObject(config)){
			throw DD.Error.handle('invoke','route',0,'object');
		}
		if(DD.isEmpty(config.module) && !config.module instanceof DD.module){
			throw DD.Error.handle('invoke2','route','module',DD.words.module,'string');	
		}
		//复制属性
		DD.assign(me,config);

		//处理module
		if(DD.isString(config.module)){  	//字符串为module名，从moduleFactory获取
			me.module = DD.Module.get(config.module);
			if(me.module === undefined){
				throw DD.Error.handle('notexist1',DD.words.module,config.module);	
			}	
		}else if(config.module instanceof DD.Module){								//参数为模块对象
			me.module = config.module;
		}
		//设置router
		me.routes = [];		//存放子路由
		me.type = 'string';	//路由类型
		var ind;
		//匹配/:  带参数的路径
		if((ind=me.path.indexOf('/:')) !== -1){
			me.type = 'param';
			var arr = me.path.split('/:');
			// 保存route基础路径
			me.path = arr[0] + '/';
			// 保存参数名数组
			me.paramNames = arr.slice(1);
		}
		if(config.routes && config.routes.length>0){
			//把路由添加到模块
			me.module.addRouter({
				routes:config.routes
			});
		}
		
	}

	/**
	 * 初始化route view
	 */
	Route.initView = function(view){
		//带保存属性
		var attrs = ['path','activeclass','active'];
		view.$isRoute = true;
		var active = false;
		//保存route参数
		for(var i=view.attributes.length-1;i>=0;i--){
			var attr = view.attributes[i];
			var an = attr.name.toLowerCase();
			if(attrs.indexOf(an) !== -1){
				view.$routeConfig[an] = attr.value;
				// 保存后删除路由相关属性
				view.removeAttribute(attr.name);
			}
			if(an === 'active'){
				view.$routeConfig['active'] = true;
			}
		}
		var path = view.$routeConfig['path'];
		if(view.tagName.toLowerCase() === 'a'){
			DD.attr(view,'href',path);
		}
		//绑定click事件
		new DD.Event({
			view:view,
			eventName:'click',
			handler:function(v,e){
	        	//阻止href跳转
	        	e.preventDefault();
	        	// 启动路由
	        	if(v.$module.router instanceof Router){
	        		v.$module.router.start(path,v,true);
	        	}
	        }
		});
	}

	/**
	 * 路由启动
	 * @param path 		路径
	 * @param pushFlag 	pushstate标志
	 */
	Route.prototype.start = function(path,pushFlag){
		var me = this;
		var router = me.router;
		// 重定向处理
    	if(!DD.isEmpty(me.redirect)){
    		var route = router.get(me.redirect);
    		if(route === undefined){
    			throw DD.error.handle('未找到匹配的路由' + me.redirect);
    		}
    		route.start(route.path);
    		return;
    	}
    	// 调用onLeave钩子
		if(router.current !== undefined){
			if(DD.isFunction(router.current.onLeave)){
				router.current.onLeave.call(router.current.module);
			}
		}

		//设置当前路由
		router.current = me;
		var params = {};
		// 处理路由参数
		if(me.type === 'param'){
			// 清空参数对象
			var pstr = path.substr(me.path.length);
			pstr.split('/').forEach(function(item,i){
				// 添加参数
				var v = item.trim();
				if(v !== ''){
					params[me.paramNames[i]] = v;
				}
			});
		}
		//加入数据集
		if(!me.module.inited){
			me.module.init(function(){
				me.module.data.set('$route',{path:path,data:params});
				doRender();
			});
		}else{
			me.module.data.set('$route',{path:path,data:params});
			doRender();
		}
		
		//popstate出发的start不进行push
		if(pushFlag){
			// pushstate
			history.pushState({module:router.module.name,path:path},'',router.root + path);
		}

		//执行渲染
		function doRender(){//渲染模块到router view中
			me.module.view = router.renderView;
			//先清空router容器
			DD.empty(me.module.view);
			// 添加到渲染列表;
			DD.Renderer.add(me.module);
			//调用onEnter钩子
			if(DD.isFunction(me.onEnter)){
				me.onEnter.call(me.module);
			}
		}
		
	}
	
	Route.prototype.match = function(path){
		var me = this;
		if(path.indexOf(me.path) === 0){
			return true;
		}
		return false;
	}
	/**
	 * 添加子路由
	 * @param config 路由参数对象，参考Route
	 */
	Route.prototype.add = function(config){
		var me = this;
		config.router = me;
		var route = config;
		if(!config instanceof Route){
			route = new Route(config);
		}
		me.routes.push(route);
		return route;
	}


	DD.Router = Router;
	DD.Route = Route;
	DD.createRoute = function(config){
		return new DD.Route(config);	
	}
}());