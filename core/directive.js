'use strict';
/**
 * @description 指令集
 * 指令优先级    数字越小优先级越高
 * @author      yanglei
 * @since       1.0.0
 */
(function(){
    var M = function(){
        var me = this;
        me.factory = {};
        me.directives = {
            model:{
                preOrder:1,
                once:true,
                sys:true,
                handler:domodel
            },
            class:{
                preOrder:1,
                once:false,
                sys:true,
                init:initclass,
                handler:doclass
            },
            repeat:{
                preOrder:6,
                once:false,
                sys:true,
                init:initrepeat,
                handler:dorepeat
            },
            if:{
                preOrder:5,
                once:false,
                sys:true,
                init:initif,
                handler:doif
            },
            else:{
                preOrder:5,
                once:false,
                sys:true,
                init:initelse
            },
            show:{
                preOrder:5,
                sys:true,
                init:initshow,
                handler:doshow
            },
            /*输入框字段*/
            field:{
                preOrder:5,
                sys:true,
                init:initfield,
                handler:dofield
            },
            /*校验*/
            validity:{
                preOrder:5,
                sys:true,
                init:initvalidity,
                handler:dovalidity
            },
            router:{
                preOrder:5,
                sys:true,
                init:initrouter,
                once:true
            },
            route:{
                preOrder:5,
                sys:true,
                init:initroute,
                handler:doroute,
                once:true
            }
        }
    }

    /**
     * 添加自定义指令
     * @param 参数 
     *      name        指令名
     *      init        初始化方法
     *      handler     调用方法
     *      preorder    优先级，自定义优先级不得低于20，优先级请谨慎设置，否则会导致解析不一致
     */
    M.prototype.add = function(param){
        var me = this;
        if(!DD.isEmpty(me.directives[param.directiveName])){
            throw DD.Error.handle('exist1',param.directiveName,DD.words.directive);
        }
        me.directives[param.directiveName] = param;
    }

    /**
     * 移除指令
     * @param directiveName 指令名
     */
    M.prototype.remove = function(directiveName){
        var me = this;
        if(me.directives[directiveName] !== undefined){
            throw DD.Error.handle('notexist1',directiveName,DD.words.directive);
        }
        delete me.directives[directiveName];
    }

    /**
     * 获取指令
     */
    M.prototype.get = function(directiveName){
        return this.directives[directiveName];
    }


    /**
     * 初始化视图指令集
     * @param view
     */
    M.prototype.initViewDirectives = function(view){
        var me = this;
        var attrs = DD.getAttrs(view,/^x-/);
        //指令排序
        if(attrs.length > 1){
            attrs.sort(function(a,b){
                var dira,dirb,da,db;
                //去掉 x-
                da = a.name.substr(2);
                db = b.name.substr(2);
                dira = me.directives[da];
                dirb = me.directives[db];
                return dira.preOrder -  dirb.preOrder;
            });
        }


        //移除指令属性
        attrs.forEach(function(attr){
            view.removeAttribute(attr.name);
        });
        //移除element中的指令
        attrs.forEach(function(attr){
            var aname = attr.name.substr(2);
            var value = attr.value;
            //把指令添加到directives数组
            view.$directives.push({name:aname,value:value});
            if(me.directives[aname] !== undefined && DD.isFunction(me.directives[aname].init)){
                me.directives[aname].init.call(view,value);
            }
        });
    }

    /**
     * 初始化指定的view 指令
     * @param view          指令对应的view
     * @param directives    指令集
     */
    M.prototype.initViewDirective = function(view,directives){
        var me = this;
        
        //指令排序
        if(directives.length > 1){
            directives.sort(function(a,b){
                var dira,dirb;
                dira = me.directives[a.name];
                dirb = me.directives[b.name];
                return dira.preOrder -  dirb.preOrder;
            });
        }
        directives.forEach(function(d){
            var value = d.value;

            //如果存在此指令，需要删除
            if(view.$getDirective(d.name) !== undefined){
                view.$removeDirective(d.name);
            }
            //把指令添加到directives数组
            if(me.directives[d.name] !== undefined && DD.isFunction(me.directives[d.name].init)){
                me.directives[d.name].init.call(view,d.value);
            }
        });
    }

    /**
     * 指令处理
     * @param view  视图
     */
    M.prototype.handle = function(view){
        var me = this;
        var el = view;
        var removeArr = [];
        view.$directives.forEach(function(item){
            var dname = item.name;
            var d = me.directives[dname];
            if(d !== undefined && DD.isFunction(d.handler)){
                
                d.handler.call(view,item);
                //只执行一遍，则需要移除，记录删除指令位置
                if(d.once === true){
                    removeArr.push(view.$directives.indexOf(item));
                }
            }
        });
        //移除只执行一次的命令
        if(removeArr.length > 0){
            for(var i=removeArr.length-1;i>=0;i--){
                view.$directives.splice(i,1);
            }
        }
    }

    /**
     * 初始化repeat 指令
     * @param value 属性值
     */
    function initrepeat(value){
        var view = this,
            alias,      //别名
            modelStr,   //模型串
            modelName,  //模型名
            filter;     //过滤器
        var ind;
        //in分隔
        var pa = value.split(' in ');
        pa[0] = pa[0].trim();
        pa[1] = pa[1].trim();
        var alias,indexName;
        //处理(item,index) 情况
        if(pa[0].charAt(0) === '(' && pa[0].charAt(pa[0].length-1) === ')'){
            var sa = pa[0].substr(1,pa[0].length-2).split(',');
            alias = sa[0].trim();
            indexName = sa[1].trim();
        }else{
            alias = pa[0];
        }

        modelStr = pa[1];
        if((ind=modelStr.indexOf('|')) !== -1){
            modelName = modelStr.substr(0,ind).trim();
            filter = modelStr.substr(ind+1).trim();
        }else{
            modelName = modelStr;
        }
        //增加x-model指令,放在repeat指令前
        view.$directives.push({name:'model',value:modelName});
        //替换repeat指令
        var d = view.$getDirective('repeat');
        d.value = modelName,
        d.filter = filter;
        d.done = false;
        //存储el
        view.$savedDoms['repeat'] = view;
        //存储each的别名

        view.$model.aliasName = alias;
        view.$model.indexName = indexName;
        //用占位符保留el占据的位置
        var tnode = document.createTextNode("");
        DD.replaceNode(view,tnode);
    }

    /**
     * 初始化if 指令
     * @param value 属性值
     */
    function initif(value){
        var view = this;
        //else节点
        var node = view.nextElementSibling;
        var d = view.$getDirective('if');
        //处理表达式
        d.value = DD.Expression.initExpr("{{" + d.value + "}}");
        //savedDom数组
        var arr = [view];

        if(DD.isEl(node) && node.hasAttribute('x-else')){
            d.hasElse = true;
            arr.push(node);
        }else{
            d.hasElse = false;
        }

        //创建占位符
        var tnode = document.createTextNode("");
        DD.replaceNode(view,tnode);

        //移除if指令
        view.$removeDirective('if');

        // 保存saveDoms
        tnode.$savedDoms['if'] = arr;
    }

    /**
     * 初始化else
     * @param value 属性值
     */
    function initelse(value){
        // 移除else指令
        this.$removeDirective('else');
        DD.remove(this);
    }

    /**
     * 初始化show
     * @param value 属性值
     */
    function initshow(value){
        var view = this;
        view.$savedDoms['show'] = view;
        var d = view.$getDirective('show');
        //处理表达式
        d.value = DD.Expression.initExpr("{{" + d.value + "}}");
        
        var tnode = document.createTextNode("");
        DD.replaceNode(view,tnode);
        view.$removeDirective('show');
    }

     /**
     * 初始化class 指令
     * @param directive 指令
     */
    
    function initclass(value){
        var view = this;
        var d = view.$getDirective('class');
        var obj = DD.parseJson(value);
        
        if(!DD.isObject(obj)){
            return;
        }
        var robj = {};
        DD.getOwnProps(obj).forEach(function(key){
            if(DD.isString(obj[key])){
                //表达式处理
                robj[key] = DD.Expression.initExpr('{{' + obj[key]+ '}}',view.$module);
            }
        });
        d.value = robj;
    }

    /**
     * 初始化field指令
     */
    function initfield(){
        var view = this;
        var dv = view.$getDirective('field').value;
        var tgname = view.tagName.toLowerCase();
        var eventName = 'input';
        if(tgname === 'input' && (view.type === 'checkbox' || view.type === 'radio')){
            eventName = 'change';
        }
        new DD.Event({
            view:view,
            eventName:eventName,
            handler:function(el,e){
                var model = el.$getData();
                //根据选中状态设置checkbox的value
                if(el.type === 'checkbox'){
                    if(DD.attr(el,'yes-value') === el.value){
                        el.value = DD.attr(el,'no-value');
                    }else{
                        el.value = DD.attr(el,'yes-value');
                    }
                }
                model[dv] = el.value;
            }
        });
    }
    
    /**
     * 初始化valid指令
     */
    function initvalidity(value){
        var view = this;
        var node = view.previousElementSibling;
        //找到对应字段进行处理，否则不进行处理，直接清空
        if(value === node.$getDirective('field').value){
            view.$validity = {field:node,tips:{}};
            var nodes = view.children;
            //异常消息
            for(var i=0;i<nodes.length;i++){
                var rel = nodes[i].getAttribute('rel');
                view.$validity.tips[rel] = nodes[i];
            }
            view.$savedDoms['validity'] = view;
            //清空
            DD.empty(view);
        }
        //创建占位符
        var tnode = document.createTextNode("");
        DD.replaceNode(view,tnode);
    }
    
    /**
     * 初始化router 指令
     */
    function initrouter(){
        if(DD.Router !== undefined){
            DD.Router.initView(this);    
        }
    }
   
    /**
     * 初始化route 指令
     * @param value 属性值
     */
    function initroute(value){
        if(!value){
            return;
        }
        value = value.trim();
        if(DD.isEmpty(value)){
            return;
        }
        if(DD.Route !== undefined){
            // 未解析的表达式，不处理
            if(value && value.substr(0,2) === '{{' && value.substr(value.length-2,2) === '}}'){
                return;
            }
            //设置path属性
            DD.attr(this,'path',value);
            DD.Route.initView(this);
        }
    }
    /**
     * 执行model指令，只执行一次
     * @param directive 指令
     */
    function domodel(directive){
        var view = this;
        view.$getData();
    }

    /**
     * repeat 指令
     * @param directive 指令
     */
    function dorepeat(directive){
        var view = this;
        if(DD.isEmpty(directive)){
            directive = view.$getDirective('repeat');
        }
        var model = view.$getData();
        //如果没有数据，则不进行渲染
        if(model === undefined || !DD.isArray(model) || model.length === 0){
            return;
        }
        var subModels = [];
        if(directive.filter !== undefined){
            //有过滤器，处理数据集合
            var dataArr = DD.Filter.handle(view.$module,model,directive.filter);
            dataArr.forEach(function(item){
                subModels.push(item);
            });
        }else{
            subModels = model;
        }
        
        //存储渲染过的element
        var renderedDoms = [];
        var bnode = view.nextElementSibling;

        while(bnode !== null && bnode.$fromNode === view){
            renderedDoms.push({
                node:bnode
            });
            bnode = bnode.nextElementSibling;
        }

        var fnode = view;
        var needSort = false;
        var newDoms = [];
        //如果新的数据模型和现在的dom 数据模型索引不同、新增dom、移除dom，都需要重新进行dom节点排序操作
        subModels.forEach(function(m,ind){
            //已绑定的node索引
            var index = -1;
            for(var i=0;i<renderedDoms.length;i++){
                if(renderedDoms[i].node.$getData() === m){
                    index=i;
                    //设置新数组中的index
                    renderedDoms[i].index = ind;
                    //index 不同，需要重新排序
                    if(i !== index){
                        needSort  = true;
                    }
                    //该节点加入到新列表
                    newDoms.push(renderedDoms[i].node);
                    break;
                }
            }
            

            //数据未绑定
            if(index === -1){
                //克隆新节点
                var nod = DD.cloneNode(view.$savedDoms['repeat']);
                //移除无用指令
                nod.$removeDirective('model');
                nod.$removeDirective('repeat');
                //保留fromnode，用于删除
                nod.$fromNode = view;
                nod.$model = {
                    aliasName:view.$model.aliasName,
                    indexName:view.$model.indexName,
                    data:m
                };
                newDoms.push(nod);
                needSort = true;
            }

        });
        //移除新数组中不包含的dom
        renderedDoms.forEach(function(node){
            if(node.index === undefined){
                DD.remove(node.node);   
            }
            needSort = true;
        });

        //排序
        //添加或移动dom节点
        if(needSort){
            var fnode = view;
            newDoms.forEach(function(node,ind){
                //设置index
                if(view.$model.indexName !== undefined){
                    node.$getData().set(view.$model.indexName,ind);
                }
                DD.insertAfter(node,fnode);
                fnode = node;
            });    
        }
    }

    /**
     * if指令执行
     * @param directive   指令，可为空
     */
    function doif(directive){
        var view = this;
        if(DD.isEmpty(directive)){
            directive = view.$getDirective('if');
        }
        var r = DD.Expression.handle(view.$module,directive.value,[view.$getData(),view.$module.data],view.$model.aliasName);
        if(!r || r === "false"){
            r = false;
        }else{
            r = true;
        }
        // 判断显示哪个节点
        var node;
        if(r){
            //如果当前if指令值为true，则直接返回
            if(directive.yes === true){
                return;
            }
            node = view.$savedDoms['if'][0];
        }else if(directive.hasElse){
            //如果当前if的值为false，则直接返回
            if(directive.yes === false){
                return;
            }
            node = view.$savedDoms['if'][1];
        }
        //保存if指令值
        directive.yes = r;
        //if节点渲染在view后，view是一个空的textnode
        if(view.nextSibling !== null && view.nextSibling.$fromNode === view){
            DD.remove(view.nextSibling);
        }
        
        if(node !== undefined){
            //避免repeat清空，直接clonenode
            var n = DD.cloneNode(node);
            DD.insertAfter(n,view);
            n.$fromNode = view;
        }
    }

    /**
     * 执行class 指令
     * @param directive 指令
     */
    function doclass(directive){
        var view = this;
        //只针对element处理
        if(view.nodeType !== Node.ELEMENT_NODE){
            return;
        }
        if(DD.isEmpty(directive)){
            directive = view.$getDirective('class');
        }
        var model = view.$getData();
        var obj = directive.value;
        DD.getOwnProps(obj).forEach(function(key){
            if(DD.isArray(obj[key])){
                var r = DD.Expression.handle(view.$module,obj[key],[model,view.$module.data],view.$model.aliasName);
                if(!r || r === "false"){
                    r = false;
                }else{
                    r = true;
                }
                if(r){
                    DD.addClass(view,key);
                }else{
                    DD.removeClass(view,key);
                }
            }
        });
    }

    /**
     * 执行show指令
     * @param directive 指令 
     */
    function doshow(directive){
        var view = this;
        if(DD.isEmpty(directive)){
            directive = view.$getDirective('show');
        }
        //执行表达式对象
        var r = DD.Expression.handle(view.$module,directive.value,[view.$getData(),view.$module.data],view.$model.aliasName);
        if(!r || r === "false"){
            r = false;
        }else{
            r = true;
        }
        if(r){
            if(directive.yes === true){
                return;
            }
            var node = DD.cloneNode(view.$savedDoms['show']);
            DD.insertAfter(node,view);
            node.$fromNode = view;
        }else{
            //if节点渲染在view后，view是一个空的textnode
            if(view.nextSibling !== null && view.nextSibling.$fromNode === view){
                DD.remove(view.nextSibling);
            }

            if(directive.yes === false){
                return;
            }
        }
        directive.yes = r;
    }

    /**
     * 执行field指令
     * @param directive 指令 
     */
    function dofield(directive){
        var view = this;
        var tp = view.type;
        var tgname = view.tagName.toLowerCase();
        if(tp !== 'radio' && tp !== 'checkbox' && tgname !== 'select'){
            return;
        }
            
        var model = view.$getData();
        var v = model[directive.value];
        if(tp === 'radio'){
            var value = DD.attr(view,'value');
            if(v == value){
                DD.attr(view,'checked','checked');
            }else{
                view.removeAttribute('checked');
            }
        }else if(tp === 'checkbox'){
            //设置状态和value
            var yv = DD.attr(view,'yes-value'); 
            if(v == yv){
                DD.attr(view,'checked','checked');
                view.value = yv;
            }else{
                view.removeAttribute('checked');
                view.value = DD.attr(view,'no-value'); 
            }
        }else if(tgname === 'select'){ //下拉框
            //option可能没生成，延迟执行
            setTimeout(function(){
                view.value = v;
            },0);
        }
    }

    /**
     * valid指令执行
     */
    function dovalidity(directive){
        var view = this;
        if(DD.isEmpty(directive)){
            directive = view.$getDirective('checked');
        }
        
        if(!view.$validity || !view.$validity.field === undefined || !view.$validity.field.validity){
            return;
        }
        //清除之前的校验提示
        if(view.nextSibling.$fromNode === view){
            DD.remove(view.nextSibling);
        }
        
        var el = view.previousElementSibling;
        var vn; //校验字段名
        //校验出现异常
        if(el !== null && !el.validity.valid){
            var vld = el.validity;
            
            var validArr = [];
            // 查找校验异常属性
            for(var o in vld){
                if(vld[o] === true) {
                    validArr.push(o);
                }
            }
            var vn = handle(validArr);
            var tips = view.$validity.tips;
            var node = view.$savedDoms['validity'].cloneNode(false);
            node.$fromNode = view;
            //用户定义的提示
            if(DD.isEl(tips[vn])){
                node.appendChild(tips[vn]);
            }else{ //系统自带提示
                var tn = document.createTextNode(DD.compileStr(DD.FormMsgs[vn],DD.attr(view.$validity.field,vn)));
                node.appendChild(tn);
            }
            //插入到占位符后
            DD.insertAfter(node,view);
        }
        function handle(arr){
            for(var i=0;i<arr.length;i++){
                switch(arr[i]){
                    case 'valueMissing':
                        return 'required';
                    case 'typeMismatch':
                        return 'type';
                        break;
                    case 'patternMismatch':
                        break;
                    case 'tooLong':
                        return 'maxLength';
                    case 'tooShort':
                        return 'minLength';
                    case 'rangeUnderflow':
                        return 'min';
                    case 'rangeOverflow':
                        return 'max';
                    case 'customError':
                        return 'custom';    
                }
            }
        }
    }

    /**
     * valid指令执行
     */
    function doroute(directive){
        var view = this;
        
        //根据默认属性触发路由
        if(view.$routeConfig['active']){
            var path = view.$routeConfig['path'];
            setTimeout(function(){
                view.$module.router.start(path,view,true);
            },0);
        }
    }
    DD.Directive = new M();
    
    /**
     * 创建新的指令
     * @param config    配置参数
     *      name    指令名
     *      init    编译时执行方法(可选)
     *      handler 渲染时执行方法(可选)
     */
    DD.Directive.create = function(config){
        if(!DD.isObject(config) || DD.isEmpty(config)){
            throw DD.Error.handle("invoke","createDirective",1,'object');
        }
        if(DD.isEmpty(config.name)){
            throw DD.Error.handle("invoke","createDirective","name",'string');   
        }
        if(DD.Directive.directives[config.name]){
            throw DD.Error.handle("exist1",DD.words.directive,config.name);      
        }

        if(config.init && !DD.isFunction(config.init)){
            throw DD.Error.handle("invoke","createDirective","init",'function');      
        }

        if(config.handler && !DD.isFunction(config.handler)){
            throw DD.Error.handle("invoke","createDirective","handler",'function');      
        }

        if(config.preOrder === undefined || config.preOrder < 10){
            config.preOrder = 10;
        }
        config.once = config.once || false;
        DD.Directive.directives[config.name] = config;
    }
    
    /**
     * 移除自定义指令
     * @param name  指令名
     */
    DD.Directive.remove = function(name){
        var dv = DD.Directive.directives[name];
        if(dv && dv.sys){
            throw DD.Error.handle("notremove1",DD.words.directive,name);
        }
        delete DD.Directive.directives[name]
    }

    DD.createDirective = DD.Directive.create;
    DD.removeDirective = DD.Directive.remove;
}());
