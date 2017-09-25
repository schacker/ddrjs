/**
 * 路由，主要用于模块间跳转，一个应用中存在一个router，多个route，route节点采用双向链表存储
 * @author 		yanglei
 * @since 		1.0.0
 * @date		2017-01-21
 * @description	采用修改页面hash方式进行路由历史控制，每个route 可设置onEnter事件(钩子) 和 onLeave事件(钩子)
 * 回调调用的几个问题
 * onLeave事件在路由切换时响应，如果存在多级路由切换，则从底一直到相同祖先路由，都会进行onLeave事件响应
 *  如：从/r1/r2/r3  到 /r1/r4/r5，则onLeave响应顺序为r3、r2
 *  onEnter事件则从上往下执行
 ß*/

(function(){
	DD.Router={
		routes:[],				// 路由集合，树形结构
		links:[],				// 路由加载链
		currentLinks:[],		// 当前路由对应的加载链
		waitLinks:[],			// 等待路由链表
		root:'', 				// 根目录
		donop:false,			// 路由切换什么都不做
		loading:false,			// 是否正在进行链式加载
		switching:false,		// 是否正在做切换效果
		switch:{			
			style:'none',		// 切换方式支持none，slide , fade
			switchTime:'1s'		// 切换时间，默认1秒
		},
		currentState:null,		// 当前状态
		history:0,				// 历史节点长度
		currentPath:undefined, 	// 当前路径
		/**
		 * 添加路由
		 * @param route 	路由
		 * @param parent  	父路由
		 */
		addRoute:function(route){
			var me = this;
			//处理树形结构
			if(!route.parent){
				me.routes.push(route);
			}
		},
		/**
		 * 移除路由
		 * @param route 	待移除的路由
		 */
		removeRoute:function(route){
			var me = this;
			var rarr;
			if(route.parent){
				rarr = route.parent.routes;
			}else{
				rarr = me.routes;
			}
			//从数组移除
			rarr.splice(rarr.indexOf(route),1);
		},
		/**
		 * 链式加载
		 */
		linkLoad:function(){
			var me = this;
			if(me.links.length>0){
				var r = me.links.shift();
				r.start(r.path);
			}else{
				me.loading = false;
			}
		},

		/**
		 * 获取路由
		 * @param path 	路径
		 * @return 		路由
		 */
		find:function(path){
			var me = this;
			var links = me.getRouteLink(path);
			if(links.length>0){
				return links[links.length-1];
			}
			return null; 
		},
		/**
		 * 根据路径获取路由链
		 * @param path 	路径
		 * @return 		路由链
		 */
		getRouteLink:function(path){
			var me = this;
			var links = [];
			find(me.routes,path);
			return links;
			
			/**
			 * 从数组中查找匹配的路由
			 * @param routeArr 	路由数组
			 * @param path 		路径
			 */
			function find(routeArr,path){
				if(!DD.isArray(routeArr) || DD.isEmpty(path)){
					return null;
				}
				var r1; //存储匹配最多的route
				for(var i=0;i<routeArr.length;i++){
					var r = routeArr[i];
					if(r.path === path){
						links.push(r);
						return r;
					}else if(path.indexOf(r.path+'/')===0){
						if(!r1 || r1.path.length<r.path.length){
							r1 = r;
						}
					}
				}

				if(r1){
					//去掉路由路径中的空格
					var path1 = path.substr(r1.path.length);
					//不要第一根横线来split
					var arr = path1.substr(1).split('/');
					// 查找参数匹配
					if(r1.type === 'param'){
						var len = arr.length<=r1.paramNames.length?arr.length:r1.paramNames.length;
						var data = {};
						// 取参数
						for(var i=0;i<len;i++){
							data[r1.paramNames[i]] = arr[i];
						}
						r1.newData = data;
						//路由进加载链
						links.push(r1);
						
						//路径只剩下参数，直接赋值，返回
						if(arr.length <= r1.paramNames.length){
							return r1;
						}
						//剩下参数还有子路由路径
						arr.splice(0,r1.paramNames.length);
						path1 = '/' + arr.join('/');
					}else{
						//路由进加载链
						links.push(r1);
					}
					if(DD.isArray(r1.routes)){
						return find(r1.routes,path1);
					}
				}
				return null;
			}
		},

		/**
		 * 启动路由
		 * @param path  	路径
		 # @param forward	true表示点击加载路由，false表示从history出来
		 */
		start:function(path,forward){
			var me = this;
			if(me.loading || me.switch.style!=='none' && me.switching){
				return false;
			}
			if(me.currentPath === path){
				return true;
			}
			//设置加载状态
			me.loading = true;
			// 清空加载链
			me.links = [];
			var links = me.getRouteLink(path);
			
			//如果已存在路由，则表示已经跳转过，需要处理
			if(me.currentLinks.length>0){
				var delInd = -1;
				var s1 = '';
				//取长度更大的那个作为便利长度
				var len = links.length>me.currentLinks.length?links.length:me.currentLinks.length;
				var delInd = len;
				for(var i=0;i<len;i++){
					if(me.currentLinks[i] !== links[i]){
						delInd = i;
						break;
					}
				}
				//相同路由链，但参数不同的情况或跳到父路由
				if(delInd === links.length && me.currentLinks.length >= links.length){
					delInd--;
				}
				
				links.splice(0,delInd);

				//从当前route开始到共同祖先为止进行onLeave钩子调用
				for(var i=me.currentLinks.length-1;i>=delInd;i--){
					var r = me.currentLinks[i];
					//删除r对应module的view
					clearView(r.module);
					if(DD.isFunction(r.onLeave)){
						r.onLeave();
					}
					//移除不要的节点
					me.currentLinks.pop();
				}

				//把新路由添加到currentLinks
				me.currentLinks = me.currentLinks.concat(links);
			}else{
				me.currentLinks = [].concat(links);
			}
			me.currentPath= path;
			me.links = links;
			if(me.links.length>0){
				//把路径pushstate
				if(forward){
					me.currentState = {path:path,index:me.history++,forward:true};
					history.pushState(me.currentState,'', DD.Router.root + path);
				}
				setTimeout(function(){me.linkLoad();},0);
			}else{
				throw DD.Error.handle('notexist1',DD.words.route,path);
				return false;
			}
			return true;
			/**
			 * 清空moduleview
			 */
			function clearView(m){
				if(!m){
					return;
				}
				m.view = null;
				//设置渲染标志
				// m.rendered = false;
				m.modules.forEach(function(m1){
					clearView(m1);
				});
			}
		},
		/**
		 * 初始化router view
		 */
		initView:function(view){
			view.$isRouterView = true;
			DD.attr(view,'role','route');
		}
	}
	
	//处理popstate事件
	window.addEventListener('popstate' , function(e){
		var me = DD.Router;
		if(me.donop){
			me.donop = false;
			return;
		}
		//根据state切换module
		var state = history.state;
		if(state){
			var fw = me.currentState && state.index < me.currentState.index?false:true;
			//如果能切换到该路由，则进行相应操作
			if(me.start(state.path)){
				me.currentState = state;
				//设置forward
				me.currentState.forward = fw;
			}else{ //否则设置donop标志，需要history相应还原
				me.donop = true;
				if(fw){
					history.go(-1);
				}else{
					history.go(1);
				}
			}
		}
	});

	/**
	 * Route 类
	 * @param config	路由参数对象
	 *			path: 	模块路径，可为空，用系统设置的模块根目录，如果不为空，则由模块根目录+设置的目录构成
	 *          module: 路由加载的模块 
	 * 			parent: 父路由 (可选)
	 *          routes: 子路由集合(可选)   
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

		//保存module或moduleName
		me.module = config.module;
		//设置router
		me.routes = [];		//存放子路由
		me.type = 'string';	//路由类型
		var ind;
		//匹配/:  带参数的路径
		if((ind=me.path.indexOf('/:')) !== -1){
			me.type = 'param';
			var arr = me.path.split('/:');
			// 保存route基础路径
			me.path = arr[0];
			// 保存参数名数组
			me.paramNames = arr.slice(1);
		}
		//添加到父对象的route列表
		if(me.parent){
			me.parent.routes.push(me);	
		}
		
		
		//添加到router
		DD.Router.addRoute(me);
		// 把子路由添加到路由树
		if(config.routes){
			config.routes.forEach(function(r){
				me.add(r);
			});
		}
	}

	/**
	 * 初始化route view
	 */
	Route.initView = function(view){
		//带保存属性
		var attrs = ['path','activeclass','active','routeview'];
		view.$isRoute = true;
		var active = false;
		//保存route参数
		for(var i=view.attributes.length-1;i>=0;i--){
			var attr = view.attributes[i];
			var an = attr.name.toLowerCase();
			if(attrs.indexOf(an) !== -1){
				view.$routeConfig[an] = attr.value;
				// 保存后删除路由相关属性,active除外
				view.removeAttribute(attr.name);	
				if(an === 'active'){
					active = true;
				}	
			}
		}
		//设置role为activeroute
		if(active){
			//设置新的active
	        DD.attr(view,'role','activeroute');
			var acls = view.$routeConfig['activeclass'];
	        if(acls){
				DD.addClass(view,acls);	
			}
		}
		
		// 设置href
		var path = view.$routeConfig['path'];
		if(view.tagName.toLowerCase() === 'a'){
			DD.attr(view,'href',path);
		}
		
		//绑定click事件
		new DD.Event({
			view:view,
			eventName:'click',
			handler:function(e,data,v){
				//阻止href跳转
	        	e.preventDefault();
	        	//找到activeroute
	        	var el = DD.get("[role='activeroute']",false,v.$module.view);
        		// 还原之前的active route
        		if(el!==null){
        			el.removeAttribute('role');
        			var cls = el.$routeConfig['activeclass'];
        			if(cls){
	        			DD.removeClass(el,cls);
	        		}
        		}
        		// 设置role
        		DD.attr(v,'role','activeroute');
	        	
        		//设置新的active
	        	cls = v.$routeConfig['activeclass'];
        		if(cls){
	        		//设置新active
	        		DD.addClass(v,cls);
	        	}
	        	DD.Router.start(path,true);
	        }
		});
	}

	/**
	 * 路由启动
	 * @param path 		路径
	 */
	Route.prototype.start = function(path){
		var me = this;
		var router = DD.Router;
		
		//设置当前路由
		router.current = me;
		// 数据更新
		me.data = me.newData;
		delete me.newData;
		//获取module
		if(DD.isString(me.module)){
			me.module = DD.Module.get(me.module);
			if(me.module === undefined){
				throw DD.Error.handle('notexist1',DD.words.module,me.module);	
			}	
		}
		//模块尚未初始化，先初始化，在进行路由切换
		if(!me.module.inited){
			me.module.init(function(){
				//初始化module数据
				if(!me.module.data){
					me.module.data = new DD.Model({data:{},module:me.module});
				}
				//增加$route数据
				me.module.data.$set('$route',{path:path,data:me.data});
				doRender();
			});
		}else{
			//初始化module数据
			if(!me.module.data){
				me.module.data = new DD.Model({data:{},module:me.module});
			}
			me.module.data.$set('$route',{path:path,data:me.data});
			doRender();
		}


		//执行渲染
		function doRender(){ //渲染模块到routerview中
			var view;

			//调用onEnter钩子
			if(DD.isFunction(me.onEnter)){
				me.onEnter.call(me.module);
			}
			if(me.parent){
				view = me.parent.module.routerView;
			}else{
				view = DD.App.routerView;
			}
			if(!view){
				throw DD.Error.handle('notexist1',me.path,DD.words.routeView);	
			}
			// 设置切换动画
			if(router.switch && router.switch.style === 'slide'){  //滑屏
				var divs = view.children;
				var slideCt;
				var width = DD.width(view,true);
				//构建滑动容器
				if(divs.length>0){
					slideCt = divs[0];
				}else{
					DD.css(view,{
						overflowX:'hidden'
					});
					slideCt = DD.newEl('div');
					DD.css(slideCt,{
						boxSizing:'border-box',
						padding:0,
						margin:0,
						transition:'transform ' + router.switch.switchTime + ' ease-out',
						transformStyle: 'preserve-3d',
						overflowX:'hidden'
					});
				
					// 设置动画结束操作
					slideCt.addEventListener('transitionend',function(){
						if(slideCt.children.length>1){
							// 移动方向
							var fw = DD.Router.currentState && !DD.Router.currentState.forward?false:true;
							if(fw){
								//调整并移除多余子节点（不带动画）
								DD.remove(slideCt.children[0]);
								DD.css(slideCt,{
									transition:'',
									transform:'translate3d(0,0,0)'
								});
							}else{
								DD.remove(slideCt.children[1]);
							}
							DD.css(slideCt,'width','');
							router.switching = false;
							// 改变移动效果，设置marginLeft
							setTimeout(function(){
								DD.css(slideCt,'transition','transform ' + router.switch.switchTime + ' ease-out');
							},50);
						}
					});
					view.appendChild(slideCt);
				}

				divs = slideCt.children;
				var div = DD.newEl('div');
				DD.css(div,{
					width:width+'px',
					float:'left'
				});
				//新建的div扩展成view
				DD.merge(div,DD.extendElementConfig);
            	div.$isView = true;
            	//确定移动方向
				var forward = DD.Router.currentState && !DD.Router.currentState.forward?false:true;
				if(divs.length > 0){ //路由不是第一次加载
					router.switching = true;
					DD.width(slideCt,width*2);
					if(forward){
						slideCt.appendChild(div);
						DD.css(slideCt,'transform','translate3d(-'+ width +'px,0,0)');	
					}else{
						slideCt.insertBefore(div,divs[0]);
						// 取消移动效果，移动slideCt
						DD.css(slideCt,{
							transition: '',
							transform: 'translate3d(-'+ width +'px,0,0)'
						});
						//延时设置margin
						setTimeout(function(){
							DD.css(slideCt,{
								transition:'transform ' + router.switch.switchTime + ' ease-out',
								transform: 'translate3d(0,0,0)'
							});
						},50);
					}
				}else{
					//第一次加载，不启用效果
					slideCt.appendChild(div);
				}
				me.module.view = div;
			}else if(router.switchStyle === 'fade'){ //淡出淡入

			}else{
				me.module.view = view;
				DD.empty(me.module.view);
			}
			// 添加渲染子节点标志
			me.module.renderChildren = true;
			DD.Renderer.add(me.module);
		}
	}
	
	/**
	 * 添加子路由
	 * @param config 路由参数对象，参考Route
	 */
	Route.prototype.add = function(config){
		var me = this;
		config.parent = me;
		var route = config;
		if(!(config instanceof DD.Route)){
			route = new Route(config);
		}
		return route;
	}

	DD.Route = Route;

	/**
	 * 创建路由
	 * @param config  路由配置对象或数组对象(多个路由)
	 */
	DD.createRoute = function(config){
		if(DD.isArray(config)){
			config.forEach(function(cfg){
				new DD.Route(cfg);
			})
		}else if(DD.isObject(config)){
			return new DD.Route(config);		
		}
	}


	//增加router和route指令
	DD.Directive.create({
		name:'route',
		preOrder:5,
		init:function(value){
			if(!value){
	            return;
	        }
	        value = value.trim();
	        if(DD.isEmpty(value)){
	            return;
	        }
            // 未解析的表达式，不处理
            if(value && value.substr(0,2) === '{{' && value.substr(value.length-2,2) === '}}'){
                return;
            }
            //设置path属性
            DD.attr(this,'path',value);
            DD.Route.initView(this);
		},
		handler:function(){
			var view = this;
			//根据默认属性触发路由
	        if(view.getAttribute('role') === 'activeroute'){
	            var path = view.$routeConfig['path'];
				if(view.$routeConfig['routeview']){
					var links = DD.Router.getRouteLink(path);
					if(links.length>0){
						var r = links[links.length-1];
						r.routeView = view;
					}
				}
				setTimeout(function(){
	                DD.Router.start(path,true);
	            },0);
	        }
		}
	});

	DD.Directive.create({
		name:'router',
		preOrder:5,
		init:function(value){
		    DD.Router.initView(this);
            this.$isRouterView = true;
		}
	});
}());