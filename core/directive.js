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
                sys:true,
                once:false,
                init:initmodel,
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
            field:{
                preOrder:5,
                init:initfield,
                handler:dofield        
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
                view.$directives.splice(removeArr[i],1);
            }
        }
    }

    /**
     * 初始化model 指令
     * @param value 属性值
     */
    function initmodel(value){
        var me = this;
        var pstr;
        var model;
        //获取祖先model str
        for(var view=me.parentNode;view && view !== me.$module.view;view=view.parentNode){
            if(view.$modelStr){
                pstr = view.$modelStr;
                if(view.$model){
                    model = view.$model;
                }
                break;
            }
        }
        if(!DD.isEmpty(value)){
            if(pstr){
                if(model && model.aliasName){
                    if(value === model.aliasName){
                        value = null;
                    }else if(value.indexOf('.')!==-1){
                        var arr = value.split('.');
                        //去掉aliasName
                        if(arr[0] === model.aliasName){
                            arr.shift();
                        }
                        value = arr.join('.');
                    }
                }
                
            }
        }
        
        me.$modelStr = value;
    }
    /**
     * 初始化repeat 指令
     * @param value 属性值
     */
    function initrepeat(value){
        var view = this;
        var alias;      //别名
        var modelStr;   //模型串
        var modelName;  //模型名
        
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
        var filter,ind;
        modelStr = pa[1];
        if((ind=modelStr.indexOf('|')) !== -1){
            modelName = modelStr.substr(0,ind).trim();
            filter = modelStr.substr(ind+1).trim();
        }else{
            modelName = modelStr;
        }
        //增加x-model指令,放在repeat指令前
        var mdir = {name:'model',value:modelName};
        view.$directives.push(mdir);
        //初始化model
        initmodel.call(view,modelName);
        
        //替换repeat指令
        var d = view.$getDirective('repeat');
        d.value = modelName;
        d.filter = filter;
        d.done = false;
        //存储别名
        view.$model.aliasName = alias;
        view.$model.indexName = indexName;
        //用占位符保留el占据的位置
        var tnode = document.createTextNode("");
        DD.replaceNode(view,tnode);
        //存储el
        tnode.$savedDoms['repeat'] = view;
        //删除保存节点的repeat指令
        view.$removeDirective('repeat');
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
        //view.$savedDoms['show'] = view;
        var d = view.$getDirective('show');
        //处理表达式
        d.value = DD.Expression.initExpr("{{" + d.value + "}}");
    }

     /**
     * 初始化class 指令
     * @param directive 指令
     */
    function initclass(value){
        var view = this;
        var d = view.$getDirective('class');
        //转换为json数据
        var obj = eval('(' + value + ')');
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
        // 带过滤器情况
        var ind,field;
        if((ind=dv.indexOf('|')) !== -1){
            field = dv.substr(0,ind);
        }else{
            field = dv;
        }
        var tgname = view.tagName.toLowerCase();
        var eventName = 'input';
        if(tgname === 'input' && (view.type === 'checkbox' || view.type === 'radio')){
            eventName = 'change';
        }

        //把字段名追加到value属性,radio有value，不能设置
        if(view.type !== 'radio'){
            view.$attrs['value']=DD.Expression.initExpr("{{" + dv+ "}}",view);
        }
        new DD.Event({
            view:view,
            eventName:eventName,
            handler:function(e,model,el){
                //根据选中状态设置checkbox的value
                if(el.type === 'checkbox'){
                    if(DD.attr(el,'yes-value') === el.value){
                        el.value = DD.attr(el,'no-value');
                    }else{
                        el.value = DD.attr(el,'yes-value');
                    }
                }
                model.data[field] = el.value;
            }
        });
    }

    /**
     * 执行model指令
     * @param directive 指令
     */
    function domodel(directive){
        var view = this;
        view.$model = view.$getData();
        delData(view);
        //删除数据
        function delData(nod){
            for(var i=0;i<nod.childNodes.length;i++){
                var n = nod.childNodes[i];
                if(n.$isView && n.$hasDirective('model')){
                    //删除数据
                    delete n.$model.data;    
                }
                //递归更新modelstr和删除数据
                delData(n); 
            }
        }
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
        //清掉之前的数据
        view.$model.data = null;
        var model = view.$getData();
        //如果没有数据，则不进行渲染
        if(model.data === undefined || !DD.isArray(model.data) || model.data.length === 0){
            return;
        }
        var subModels = [];
        if(directive.filter){
            //有过滤器，处理数据集合
            subModels = DD.Filter.handle(view.$module,model.data,directive.filter);
        }else{
            subModels = model.data;
        }

        //存储渲染过的element
        var renderedDoms = [];
        var bnode = view.nextElementSibling;

        while(bnode !== null && bnode.$fromNode === view){
            renderedDoms.push(bnode);
            bnode = bnode.nextElementSibling;
        }

        var fnode = view;
        var needSort = false;
        var newDoms = [];
        var fnode;
        subModels.forEach(function(m,i){
            var nod;
            if(i<renderedDoms.length){
                nod = renderedDoms[i];
            }else{  //增加新的dom
                nod = DD.cloneNode(view.$savedDoms['repeat']);
                //保留fromnode，用于删除
                nod.$fromNode = view;
                DD.insertAfter(nod,fnode);
            }
            nod.$modelStr = view.$modelStr;
            fnode = nod;
            nod.$model.data = m;
            if(nod.$model.indexName){
                nod.$model.data[nod.$model.indexName]=i;
            }
        });
        //从已渲染列表移除多余的节点
        for(var i=renderedDoms.length-1;i>=subModels.length;i--){
            DD.remove(renderedDoms[i]);
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
        var model = view.$getData();
        var r = DD.Expression.handle(view.$module,directive.value,model);
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
            updModelStr(n);
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
                var r = DD.Expression.handle(view.$module,obj[key],model);
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
        if(directive.display === undefined){
            setTimeout(function(){
                var dip = DD.css(view,'display');
                if(!dip || dip === 'none'){
                    dip = 'block';
                }
                directive.display = dip;
                render();       
            },0);
        }else{
            render();
        }
        
        function render(){
            var model = view.$getData();
            //执行表达式对象
            var r = DD.Expression.handle(view.$module,directive.value,model);
            if(!r || r === "false"){
                r = false;
            }else{
                r = true;
            }
            
            if(r){
                if(directive.yes === true){
                    return;
                }
                DD.css(view,'display',directive.display);
                updModelStr(view);
            }else{
                if(directive.yes === false){
                    return;
                }
                DD.css(view,'display','none');
            }
            directive.yes = r;    
        }
    }

    /**
     * 更新modelStr
     * @param node      要更新的节点
     * @param genFlag   
     */
    function updModelStr(node,genFlag){
        var oldStr = node.$modelStr;
        if(genFlag){ //子节点重新生成modelStr
            if(node.$hasDirective('model')){
                initmodel.call(node,node.$getDirective('model').value);
            }
        }else if(oldStr){
            //更新modelStr中的index
            var str='';
            if(node.$model && node.$model.index>=0){
                node.$modelStr += '[' + node.$model.index + ']';
            }
        }    
        //操作子节点
        for(var i=0;i<node.childNodes.length;i++){
            var n = node.childNodes[i];
            if(n.$isView){
                updModelStr(n,true);
            }
        }
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
        var v = model.data[directive.value];
        if(tp === 'radio'){
            var value = view.value;
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
