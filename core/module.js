'use strict';

/**
 * @description 模块
 * @author  yanglei
 * @since   1.0.0
 */

(function(){
    /**
     * 添加模块，参数参见module定义
     * @param config    el:             element选择器
     *                  name:           moduleName
     *                  className:      模块类名
     *                  data:           数据
     *                  dataUrl:        数据地址
     *                  template:       模版
     *                  templateUrl:    模版文件
     *                  delayInit:      延迟初始化，默认false 
     *                  requires:[]	    模块依赖的文件，需要标明类型，默认为js，如[{type:'css',file:'path/1.css'},{type:'js',file:'path/1.js'}]
     *                  fromModules:[]  来源消息模块列表
     *                  methods:        方法集合
     */
    var Module = function(config){
        var me = this;
        
        me.name = config.name || 'DDModule_' + DD.genId();  // 模块名
        me.methodFactory = new DD.MethodFactory();          // 方法集合    
        me.events = {};                                     // 事件集合
        me.modules = [];                                    // 子模块集合
        me.inited = false;
        me.compiled = false;
        me.onReceive = config.onReceive;
        me.fromModules = config.fromModules;
        me.onRender = config.onRender;
        me.initConfig = DD.merge({delayInit:false},config);
        me.el = me.initConfig.el;

        //把方法添加到module对应的methodFactory
        if(!DD.isEmpty(config.methods)){
            DD.getOwnProps(config.methods).forEach(function(item){
                me.methodFactory.add(item,config.methods[item]);
            });
        }
        // 删除已处理的方法集
        delete config.methods;
        //初始化module
        if(!me.initConfig.delayInit){
            me.init(config);
        }

        return me;
    }

    /**
     * 初始化
     */
    Module.prototype.init = function(callback){
        var me = this;
        var config = me.initConfig;
        //初始化路由
        if(config.router !== undefined && config.router !== null){
            me.addRouter(config.router);
        }
        me.inited = true;

        loadRequireRes();

        /**
         * 加载reqiure资源
         */
        function loadRequireRes(){
            var loadCnt = 0;
            if(DD.isArray(config.requires) && config.requires.length>0){
                config.requires.forEach(function(item){
                    var type = 'js' || item.type;
                    var path;
                    if(DD.isObject(item)){
                        path=item.path;
                        type = item.type || type;
                    }else if(typeof item === 'string'){
                        path = item;
                    }

                    switch(type){
                        case 'css': //css
                            //已加载的不再加载
                            var cs = DD.get("link[href='" + path + "']");
                            if(cs !== null){
                                return;
                            }
                            var css = DD.newEl('link');
                            css.type = 'text/css';
                            css.rel = 'stylesheet'; 
                            // 保留script标签的path属性
                            css.href = path;
                            var head = DD.get('head');
                            if(head === null){
                                head = document.body;
                            }
                            head.append(css);
                            break;
                        default:   //js
                            var cs = DD.get("script[src='" + path + "']");
                            if(cs !== null){
                                return;
                            }
                            loadCnt++;
                            // 加载
                            DD.http.load({
                                url:path,
                                type:type,
                                successFunc:function(){
                                    //加载module资源
                                    if(--loadCnt === 0){
                                        loadModuleRes();
                                    }
                                }
                            });
                    }
                });
                if(loadCnt === 0){
                    loadModuleRes();    
                }
            }else{
                loadModuleRes();
            }
        }
        /**
         * 加载data、template资源
         */
        function loadModuleRes(){
            //数据
            if(DD.isObject(config.data)){
                initData(config.data);
            }else if(!DD.isEmpty(config.dataUrl)){      //加载数据
                DD.http.load({
                    url:config.dataUrl,
                    type:'json',
                    successFunc:function(r){
                        initData(r);
                    }
                });
            }else{
                //空数据
                initData({});
            }

            //设置父module
            if(config.parent instanceof Module){
                me.parent = config.parent;
            }
            

            //创建virtualDom
            if(!me.virtualDom){
                me.virtualDom = DD.newEl('div');
                //子视图
                if(me.parent){
                    var view = DD.get(config.el,false,me.parent.virtualDom);
                    if(view  !== null){
                        //转移子节点到virtualDom
                        DD.transChildren(view,me.virtualDom);
                    }
                }else{ // 父试图
                    var view = DD.get(config.el,false,document.body);
                    if(view  !== null){
                        //转移子节点到virtualDom
                        DD.transChildren(view,me.virtualDom);
                        // 设定module 对应view
                        me.view = view; 
                        //扩展me.view    
                        DD.merge(me.view,DD.extendElementConfig);   
                        //清空
                        DD.empty(me.view);
                    }
                }

                // 处理模版串
                if(!DD.isEmpty(config.template)){                   //template string
                    composite(config.template);
                }else if(!DD.isEmpty(config.templateUrl)){         //template file
                    var path = config.templateUrl;
                    if(DD.config && !DD.isEmpty(DD.config.appPath)){
                        path = DD.config.appPath + '/' + path;
                    }
                    DD.http.load({
                        url:path,
                        successFunc:function(r){
                            composite(r);
                        }
                    });
                }else{
                    composite(null);
                }
            }
        }

        /**
         * 初始化数据
         * @param data 模型的数据
         */
        function initData(data){
            me.data = new DD.Model({data:data,module:me});
            DD.Renderer.add(me);    
        }

        /**
         * 组合virturlDom 的innerHTML
         * @param html 添加的html
         */
        function composite(html){
            //把html 添加到
            if(html !== null){
                DD.append(me.virtualDom,html);
            }

            me.compile();
            
            //子模块初始化
            if(DD.isArray(config.modules)){
                config.modules.forEach(function(mc){
                    me.addModule(mc);
                });
            }
            
            // 初始化回调
            if(DD.isFunction(callback)){
                callback(me);
            }
            //删除initConfig
            delete me.initConfig;
        }
    }
        
    /**
     * 编译模版或element
     */
    Module.prototype.compile = function(){
        var me = this;
        var cls;
        me.compiled=false;
        // class存在，则需要先检查class是否存在virtualDom，如果存在，则不用再编译，否则把模块的virturalDom编译了给class
        if(me.className && (cls = DD.Module.getClass(me.className))!==undefined && cls.virtualDom !== null){
            me.virtualDom = cls.virtualDom;
            return;
        }
        //编译
        var vd = compileEl(me.virtualDom);
        if(cls !== undefined){
            cls.virtualDom = vd;
        }
        me.compiled = true;
        
        /**
         * 编译单个element
         * @param el    待编译的element
         * @return      编译后的element
         */
        function compileEl(el){
            //扩展element方法
            DD.merge(el,DD.extendElementConfig);
            // 指定模块
            el.$module = me;
            
            //处理属性指令
            DD.getAttrsByValue(el,/\{\{\S+?\}\}/).forEach(function(attr){
                // 保存带表达式的属性
                el.$attrs[attr.name]=DD.Expression.initExpr(attr.value,el);
            });

            //初始化指令集
            DD.Directive.initViewDirectives(el);
            //遍历childNodes进行指令、表达式、路由的处理
            var nodes = el.childNodes;
            for(var i=0;i<nodes.length;i++){
                var node = nodes[i];
                switch(node.nodeType){
                    case Node.TEXT_NODE:        // 文本
                        // 处理文本表达式
                        if(/\{\{.+\}\}?/.test(node.textContent)){
                            //处理表达式
                            node.$exprs = DD.Expression.initExpr(node.textContent,me);
                            //textcontent 清空
                            node.textContent = '';
                        }
                        break;
                    case Node.COMMENT_NODE:     // 注释，需要移除
                        el.removeChild(node);
                        i--;
                        break;
                    default:                    // 标签 Node.ELEMENT_NODE
                        compileEl(node);
                }
            }
            return el;
        }

    }
    /**
     * 渲染
     * @param container     容器
     * @param data          数据
     */
    Module.prototype.render = function(container,data){
        var me = this;
        
        //无数据 或 view没有compile
        if(!me.data || !me.compiled){
            return false;
        }

        // me.view不存在，需要查找
        if(!DD.isEl(me.view)){
            getView(me);
        }

        //找不到view，返回
        if(!DD.isEl(me.view)){
            return false;
        }
        if(me.view.childNodes.length === 0){ //没渲染过，从virtualDom渲染
            //用克隆节点操作，不影响源节点
            var cloneNode = DD.cloneNode(me.virtualDom);
            //把cloneNode下的所有节点渲染到view
            renderDom(cloneNode,true);
            //把clone后的子节点复制到模块的view
            DD.transChildren(cloneNode,me.view);
            //触发首次渲染事件
            if(!me.rendered && DD.isFunction(me.onRender)){
                me.onRender();
            }
            //设置已渲染标志
            me.rendered = true;
        }else{  //渲染过，从view渲染
            renderDom(me.view,true);
        }
        
        //渲染成功
        return true;
        
        /**
         * 渲染virtual dom
         * @param node      待渲染节点
         * @param isRoot    是否是根节点
         */
        function renderDom(node,isRoot){
            if(node.$isView){
                var model = node.$getData();
                var alias = node.$model.aliasName;
                //设置routerview,不是root的才处理
                if(node.$isRouter && !isRoot && me.router){
                    me.router.renderView = node;
                }
                //未渲染，则进行事件初始化
                if(!node.$rendered && DD.isEl(node)){
                    initEvents(node);
                }

                //处理属性
                if(DD.isEl(node)){
                    var directives = [];
                    DD.getOwnProps(node.$attrs).forEach(function(attr){
                        if(typeof(node.$attrs[attr]) === 'function'){
                            return;
                        }
                        var v = DD.Expression.handle(node,node.$attrs[attr],[model,me.data],alias);
                        //指令属性不需要设置属性值
                        if(attr.substr(0,2) === 'x-'){
                            directives.push({
                                name:attr.substr(2),
                                value:v
                            });
                        }else {  //普通属性
                            DD.attr(node,attr,v);    
                        }
                    });
                    //指令属性修改后，需要重新初始化指令
                    if(directives.length > 0){
                        DD.Directive.initViewDirective(node,directives);
                    }
                }

                //处理指令
                DD.Directive.handle(node);
                //渲染子节点
                if(node.childNodes){
                    for(var i=0;i<node.childNodes.length;i++){
                        renderDom(node.childNodes[i]);
                    }
                }
                //设置渲染标志
                node.$rendered = true;
            }else if(node.nodeType === Node.TEXT_NODE && node.$exprs !== undefined){
                var c = DD.Expression.handle(me,node.$exprs,[node.parentNode.$getData(),me.data],node.parentNode.$model.aliasName); 
                //清除之前加载的节点
                var bn = node.nextSibling;
                for(;bn!==null && bn.$fromNode === node;){
                    var n = bn.nextSibling;
                    DD.remove(bn);
                    bn = n;
                }
                //表达式处理后得到结果
                //如果存在element，则直接添加到node后面，否则修改node的textContent
                var div = document.createElement('div');
                div.innerHTML = c;
                var frag = document.createDocumentFragment();
                var hasEl = false;
                for(var i=0;i<div.childNodes.length;){
                    var n = div.childNodes[i];
                    if(DD.isEl(n)){
                        hasEl = true;
                    }
                    n.$fromNode = node;
                    frag.append(div.childNodes[i]);
                }
                if(!hasEl){
                    node.textContent = c;
                }else{
                    DD.insertAfter(frag,node);
                }
            }
            return node;
        }

        /**
         * 获取view
         */
        function getView(module){
            if(!module.view){
                if(module.parent){
                    // 父view不存在，级联上找
                    if(!module.parent.view){
                        getView(module.parent);
                    }
                    if(module.parent.view !== undefined){
                        module.view = DD.get(me.el,false,module.parent.view);
                    }
                    // 清空模块view
                    if(module.view){
                        DD.empty(module.view);
                    }
                }
            }
            return module.view;
        }

        /**
         * 初始化事件
         */
        function initEvents(el){
            var attrs = DD.getAttrs(el,/^e-/);
            if(attrs.length>0){
                attrs.forEach(function(attr){
                    //处理管道
                    var arr = attr.value.split(':');
                    var handler = me.methodFactory.get(arr[0]);
                    //如果不存在事件方法，则不处理，可能是子模块方法，留给子模块处理
                    if(!handler){
                        return;
                    }
                    //去掉e-前缀
                    var ename = attr.name.substr(2);
                    
                    //处理多个参数
                    var param = {
                        view:el,
                        eventName:ename,
                        handler:handler
                    };
                    if(arr.length>1){
                        for(var i=1;i<arr.length;i++){
                            param[arr[i]] = true;
                        }
                    }
                    //新建事件并绑定
                    new DD.Event(param);
                    //移除事件属性
                    el.removeAttribute(attr.name);
                });
            }
        }
    }
    /**
     * 销毁
     */
    Module.prototype.destroy=function(){
        delete DD.Module.moduleFactory[this.name];
        DD.Renderer.remove(this);
    }
    /**
     * 添加子模块
     * @param moduleName    模块名
     * @param config        配置
     * @return              新建的module
     */
    Module.prototype.addModule=function(config){
        var me = this;
        if(!DD.isObject(config)){
            throw DD.Error.handle('invoke1','addModule',0,'object');
        }

        if(me.getModule(config.name) !== null){
            throw DD.Error.handle('exitst1',DD.words.module,config.name);   
        }
        config.parent = me;
        var m = DD.Module.newInstance(config);
        me.modules.push(m);
        return m;
    }
    /**
     * 添加路由
     */
    Module.prototype.addRouter = function(config){
        var me = this;
        var router;
        if(config instanceof DD.Router){
            config.module = me;
            router = config;
        }else if(DD.isObject(config)){
            config.module = me;
            router = new DD.Router(config); 
        }
        me.router = router;
        return router;
    }
    /**
     * 手动为模块设置数据
     * @param data  待设置的数据
     */
    Module.prototype.setData = function(data){
        var me = this;
        //复制模块中$开头的数据，这些数据是系统数据
        DD.getOwnProps(me.data).forEach(function(item){
            if(item[0] === '$'){
                data[item] = me.data[item]; 
            }
        });
        //清理所有子view数据
        if(me.view){
            DD.empty(me.view);
        }
        new DD.Model({data:data,module:me});
        DD.Renderer.add(me);
    }

    /**
     * 查找子module
     * @param moduleName   模块名
     * @return  module 或 null
     */
    Module.prototype.getModule = function(moduleName){
        if(DD.isEmpty(moduleName)){
            throw DD.Error.handle('invoke1','getModule',0,'string');
        }
        for(var i=0;i<this.modules.length;i++){
            if(this.modules[i].name === moduleName){
                return this.modules[i];
            }
        }
        return null;
    }

    
    /**
     * 广播，向兄弟模块广播
     * @param data    广播的数据
     */
    Module.prototype.broadcast = function(data){
        var me = this;
        if(!me.parent){
            return;
        }
        var mname = me.name;
        me.parent.modules.forEach(function(m){
            if(m === me){
                return;
            }
            if(DD.isFunction(m.onReceive)){
                var call = true;
                //如果fromModules 是数组且不为空，则要判断是否要接收该module发送来的消息
                if(DD.isArray(m.fromModules) && m.fromModules.length !== 0){
                    if(m.fromMudules.indexOf(mname) === -1){
                        call = false;
                    }
                }
                if(call){
                    m.onReceive.call(m,mname,data);
                }
            }
        });
    }
    
    /**
     * 扩展DD.Module
     */
    DD.assign(Module,{
        classFactory:{},     //类工厂
        moduleFactory:{},    //模块集
        /**
         * 定义模块类
         * @param config    配置
         *          className:      类名
         *          extend:         父类名
         *          template:       模版
         *          templateUrl:    模版文件路径 
         *          methods:        方法集
         *          onReceive:      方法接收处理函数
         */

        define:function(config){
            var me = this;
            var cname = config.className;
            if(!cname){
                throw DD.Error.handle('invoke','define','string');
            }
            if(me.classFactory[cname] !== undefined){
                throw DD.Error.handle('exist1',DD.words.moduleClass,cname);
            }
            //存储类
            me.classFactory[cname] = DD.merge({virtualDom:null},config);
            return me.classFactory[cname];
        },

        /**
         * 获取class
         * @param clsName   类名
         * @return          类或null
         */
        getClass:function(clsName){
            return this.classFactory[clsName];
        },
        /**
         * 实例化一个模块
         * @param config    配置
         *          name:       模块名
         *          className:  类名 
         * @return 新建的模块
         */
        newInstance:function(config){
            var me = this;
            var mname = config.name;
            var param;
            if(!DD.isEmpty(config.className)){
                var cls = me.getClass(config.className);
                if(cls !== undefined){
                    param = DD.extend({},cls,config);
                }
            }else{
                param = config;
            }
            

            // 模块实例化
            var m = new DD.Module(param);
            
            // 添加到模块集
            me.moduleFactory[m.name] = m;
            return m;
        },

        /**
         * 获取模块
         * @param mname     模块名
         * @return          模块
         */
        get:function(mname){
            return this.moduleFactory[mname];
        }
    });

    //扩展DD，增加module相关
    DD.assign(DD,{
        createModule:function(config){
            return DD.Module.newInstance(config);
        },
        defineModule:function(config){
            return DD.Module.define(config);
        }
    });
    

    DD.Module = Module;
}());
