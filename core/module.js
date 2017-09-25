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
     *                  needCompile:    是否需要编译，默认为true
     *                  onInit:         初始化后执行的函数(compile,data加载后)
     *                  onFirstRender:  首次渲染后执行的函数
     *                  onRender:       每次渲染后执行的函数  
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
        me.compiled = false;
        me.inited = false;
        me.onReceive = config.onReceive;
        me.onInit = config.onInit;    
        me.fromModules = config.fromModules;
        
        me.onRender = config.onRender;
        me.onFirstRender = config.onFirstRender;
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
        //设置根module
        if(config.root === true){
            DD.App = me;
        }
        return me;
    }

    /**
     * 初始化
     */
    Module.prototype.init = function(callback){
        var me = this;
        var config = me.initConfig;
        //设置父module
        if(config.parent instanceof Module){
            me.parent = config.parent;
        }
        
        //创建virtualDom
        me.virtualDom = DD.newEl('div');
        var pview;  //父module view
        var view;   //当前模块在父module中的view   
        //如果父模块存在
        if(me.parent){
            if(me.parent.$rendered){
                pview = me.parent.view;
            }else{
                pview = me.parent.virtualDom;
            }
        }else{ // 父视图
            pview = document.body;
        }
        
        view = DD.get(config.el,false,pview);
        //从父复制编译过的节点到virtualdom
        if(view && view.childNodes){
            DD.transChildren(view,me.virtualDom);
        }
        //调用模版和数据加载方法    
        me.load(function(data,tpl){
            //模版不为空，模版节点入virtualDom并进行编译
            if(!DD.isEmpty(tpl)){
                //把模版串形成的节点放入virtualdom
                var div = DD.newEl('div');
                div.innerHTML = tpl;
                DD.transChildren(div,me.virtualDom);
            }
            //编译
            me.compile();
            DD.Renderer.add(me);
            //有数据，添加到渲染列表
            if(data){
                me.data = new DD.Model({data:data,module:me});
            }
            
            //子模块初始化
            if(DD.isArray(config.modules)){
                config.modules.forEach(function(mc){
                    me.addModule(mc);
                });
            }
            
            //初始化事件
            if(DD.isFunction(config.onInit)){
                config.onInit.call(me);
            }
            
            // 初始化回调
            if(DD.isFunction(callback)){
                callback(me);
            }
            //删除initConfig
            delete me.initConfig;
        });
        me.inited = true;
    }

    /**
     * 加载模块
     * @param callback  加载后的回调函数
     */
    Module.prototype.load = function(callback){
        var me = this;
        var config = me.initConfig;
        //资源加载数
        var reqCnt = 0;
        //模块数据
        var mdlData;
        //模版串
        var mdlTpl;
        loadRequireRes();
        loadModuleRes();
        //如果不存在加载，则直接执行回调
        if(reqCnt === 0){
            checkCB();
        }
        function checkCB(){
            if(DD.isFunction(callback) && reqCnt===0){
                callback(mdlData,mdlTpl);
            }
        }
        /**
         * 加载require资源
         */
        function loadRequireRes(){
            if(DD.isArray(config.requires) && config.requires.length>0){
                config.requires.forEach(function(item){
                    var type = 'js';
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
                            reqCnt++;
                            // 加载
                            DD.request({
                                url:path,
                                type:type,
                                successFunc:function(){
                                    //加载module资源
                                    if(--reqCnt === 0){
                                        checkCB();
                                    }
                                }
                            });
                    }
                });
            }
        }


        /**
         * 加载模块资源 data、template
         */
        function loadModuleRes(){
            //数据
            if(DD.isObject(config.data)){
                mdlData = config.data;
            }else if(!DD.isEmpty(config.dataUrl)){      //加载数据
                reqCnt++;
                DD.request({
                    url:config.dataUrl,
                    type:'json',
                    successFunc:function(r){
                        mdlData = r;
                        if(--reqCnt === 0){
                            checkCB();    
                        }
                    }
                });
            }
            
            //模版串
            if(!DD.isEmpty(config.template)){                   //template string
                mdlTpl = config.template;
            }else if(!DD.isEmpty(config.templateUrl)){          //template file
                var path = config.templateUrl;
                if(DD.config && !DD.isEmpty(DD.config.appPath)){
                    path = DD.config.appPath + '/' + path;
                }
                reqCnt++;
                DD.request({
                    url:path,
                    successFunc:function(r){
                        mdlTpl = r;
                        if(--reqCnt === 0){
                            checkCB();
                        }
                    }
                });
            }
        }
    }
        
    /**
     * 编译模版或element
     * @param view 指定的view，可选，默认为virtualDom
     */
    Module.prototype.compile = function(dstView){
        var me = this;
        var cls;
        me.compiled=false;
        //ddr 是否class存在，则需要先检查class是否存在virtualDom，如果存在，则不用再编译，否则把模块的virturalDom编译了给class
        if(me.className && (cls = DD.Module.getClass(me.className))!==undefined && cls.virtualDom !== null){
            me.virtualDom = cls.virtualDom;
            return;
        }
        //编译
        if(dstView){
            compileEl(dstView);
        }else{
            var vd = compileEl(me.virtualDom);
            if(cls !== undefined){
                cls.virtualDom = vd;
            }
            me.compiled = true;
        }
        
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
            DD.getAttrsByValue(el,/\{\{.+?\}\}/).forEach(function(attr){
                me.needData = true;
                // 保存带表达式的属性
                el.$attrs[attr.name]=DD.Expression.initExpr(attr.value,el);
            });
            
            //初始化指令集
            DD.Directive.initViewDirectives(el);
            if(el.$hasDirective('model')){
                me.needData = true;
            }
            
            //遍历childNodes进行指令、表达式、路由的处理
            var nodes = el.childNodes;
            for(var i=0;i<nodes.length;i++){
                var node = nodes[i];
                switch(node.nodeType){
                    case Node.TEXT_NODE:        // 文本
                        // 处理文本表达式
                        if(/\{\{.+\}\}?/.test(node.textContent)){
                            me.needData = true;
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
        
        // 获取渲染容器
        getView(me);
        //找不到view，返回
        if(!DD.isEl(me.view)){
            return true;
        }

        //设置模块view为view
        if(!me.view.$isView){
            DD.merge(me.view,DD.extendElementConfig);
            me.view.$isView = true;
        }
        if(me.needData && !me.data){
            return;
        }
        if(me.view.childNodes.length === 0){ //没渲染过，从virtualDom渲染
            //用克隆节点操作，不影响源节点
            var cloneNode = DD.cloneNode(me.virtualDom);
            //把cloneNode下的所有节点渲染到view
            renderDom(cloneNode,true);
            //把clone后的子节点复制到模块的view
            DD.transChildren(cloneNode,me.view);
            me.view.$containModule = true;  //设置view的对应module
            //触发首次渲染事件
            if(!me.rendered && DD.isFunction(me.onFirstRender)){
                me.onFirstRender();
            }
            //设置已渲染标志
            me.rendered = true;
        }else{  //渲染过，从view渲染
            renderDom(me.view,true);
        }
        //调用onRender事件
        if(DD.isFunction(me.onRender)){
            me.onRender();
        }
        
        //渲染子节点
        if(me.renderChildren){
            me.modules.forEach(function(m){
                m.renderChildren = true;
                m.render();
            });
            //删除渲染子节点标志
            delete me.renderChildren;
        }

        //路由链式加载
        if(DD.Router){
            setTimeout(function(){DD.Router.linkLoad()},0);
        }
        //渲染成功
        return true;
        
        /**
         * 渲染virtual dom
         * @param node      待渲染节点
         * @param isRoot    是否为根节点
         */
        function renderDom(node,isRoot){
            //判断并设置routerview
            if(node.$isRouterView === true){
                me.routerView = node;
            }
            node.$module = me;
            //不渲染子模块
            if(node !== me.view && node.$containModule){
                return;
            }
            if(node.$isView){
                //未渲染，则进行事件初始化
                if(!node.$rendered && DD.isEl(node)){
                    initEvents(node);
                }
                var model = node.$getData();
                //无数据则不进行指令和表达式计算
                // if(model.data){
                    //处理属性
                    if(DD.isEl(node)){
                        var directives = [];
                        DD.getOwnProps(node.$attrs).forEach(function(attr){
                            if(typeof(node.$attrs[attr]) === 'function'){
                                return;
                            }
                            var v = DD.Expression.handle(me,node.$attrs[attr],model);
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
                // }
                //渲染子节点
                if(node.childNodes){
                    for(var i=0;i<node.childNodes.length;i++){
                        renderDom(node.childNodes[i]);
                    }
                }
                //设置渲染标志
                node.$rendered = true;
            }else if(me.data && node.nodeType === Node.TEXT_NODE && node.$exprs){
                var model = node.parentNode.$getData();
                if(model.data){
                    var c = DD.Expression.handle(me,node.$exprs,model); 
                    //清除之前加载的节点
                    var bn = node.nextSibling;
                    for(;bn!==null && bn.$genNode;){
                        var n = bn.nextSibling;
                        DD.remove(bn);
                        bn = n;
                    }
                    
                    var div = document.createElement('div');
                    div.innerHTML = c;
                    // 新增el，需要编译
                    me.compile(div);
                    var frag = document.createDocumentFragment();
                    var hasEl = false;
                    for(var i=0;i<div.childNodes.length;){
                        var n = div.childNodes[i];
                        if(DD.isEl(n)){
                            hasEl = true;
                        }
                        n.$genNode = true;
                        frag.appendChild(div.childNodes[i]);
                    }
                    if(!hasEl){
                        node.textContent = c;
                    }else{
                        DD.insertAfter(frag,node);
                    }
                }
            }
            return node;
        }

        /**
         * 获取view
         */
        function getView(module){
            //此处需增加处理路由器view
            if(!module.view){
                if(module.parent){
                    // 父view不存在，级联上找
                    if(!module.parent.view){
                        getView(module.parent);
                    }
                    if(module.parent.view){
                        module.view = DD.get(module.el,false,module.parent.view);
                    }
                }else{
                    module.view = DD.get(module.el,false,document.body);
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
                    console.log(param);
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
        config.parent = me;
        var m = DD.Module.newInstance(config);
        me.modules.push(m);
        return m;
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
        new DD.Model({data:data,module:me});
    }

    /**
     * 广播，向兄弟和父模块广播
     * @param data    广播的数据
     */
    Module.prototype.broadcast = function(data){
        var me = this;
        if(!me.parent){
            return;
        }
        var mname = me.name;
        //兄弟模块
        var mdls = me.parent.modules;
        //子模块
        mdls = mdls.concat(me.modules);
        // 父模块
        mdls.push(me.parent);
        mdls.forEach(function(m){
            if(m === me){
                return;
            }
            if(DD.isFunction(m.onReceive)){
                var call = true;
                //如果fromModules 是数组且不为空，则要判断是否要接收该module发送来的消息
                if(DD.isArray(m.fromModules) && m.fromModules.length !== 0){
                    if(m.fromModules.indexOf(mname) === -1){
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
            if(me.classFactory[cname]){
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
            //判断该名字是否存在
            if(config.name && me.get(config.name)){
                throw DD.Error.handle('exist1',DD.words.module,config.name);   
            }
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
            if(DD.isArray(config)){
                config.forEach(function(cfg){
                    DD.Module.newInstance(cfg);
                })
            }else{
                return DD.Module.newInstance(config);
            }
        },
        defineModule:function(config){
            return DD.Module.define(config);
        }
    });
    
    DD.Module = Module;
}());
