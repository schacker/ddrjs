//扩展element方法
DD.extendElementConfig = {
    $module:null,           //模块
    $directives:[],         //指令集和
    $savedDoms:{},          //保存的dom集合
    $model:{},              //模型相关参数
    $attrs:{},              //带表达式的属性集合
    $exprs:[],              //表达式数组
    $isView:true,           //view标志
    $events:{},             //事件集合
    $validity:null,         //字段校验{field:字段对象,tips:提示element}
    $routeConfig:{},        //路由配置
    /**
     * 查找子节点
     * @param selector  选择器
     * @param all       false 返回第一个element，true 返回所有匹配的elements，默认false
     * @return          element/null 或 element 数组/[]  
     */
    $find:function(selector,all){
        if(all){
            return this.querySelectorAll(selector);
        }
        return this.querySelector(selector);
    },
    /**
     * 是否包含指定指令
     * @param directive     指令名
     * @return true/false
     */
    $hasDirective:function(directive){
        var me = this;
        var ds = me.$directives;
        if(DD.isArray(ds)){
            for(var i=0;i<ds.length;i++){
                if(ds[i].name === directive){
                    return true;
                }
            }    
        }
        return false;
    },
    /**
     * 获取指定指令
     * @param directive     指令名
     * @return 指令或 null
     */
    $getDirective:function(directive){
        var me = this;
        var ds = me.$directives;
        if(DD.isArray(ds)){
            for(var i=0;i<ds.length;i++){
                if(ds[i].name === directive){
                    return ds[i];
                }
            }
        }
        return null;
    },

    /**
     * 移除指定指令
     * @param directive     指令名
     */
    $removeDirective:function(directive){
        var me = this;
        var ds = me.$directives;
        if(DD.isArray(ds)){
            for(var i=0;i<ds.length;i++){
                if(ds[i].name === directive){
                    ds.splice(i);
                    break;
                }
            }
        }
    },
    
    /**
     * 获取数据
     * @return 数据
     */
    $getData:function(){
        var me = this;
            
        if(!me.$isView){
            return null;
        }
        if(me.$model.data === undefined){
            var model;
            var data;
            //根view
            if(me.parentNode === null){
                var data = me.$module.data;
                if(me.$hasDirective('model')){
                    data = data[me.$getDirective('model').value];    
                }
                me.$model.data = data;
            }else{  //其他view
                if(me.parentNode !== null && me.parentNode.$isView){
                    data = me.parentNode.$getData();
                    model = me.parentNode.$model;
                }
                if(model !== undefined){
                    //继承aliasName和indexName
                    if(me.$model.aliasName === undefined){
                        me.$model.aliasName = model.aliasName;
                    }
                    if(me.$model.indexName === undefined){
                        me.$model.indexName = model.indexName;
                    } 

                    if(!DD.isEmpty(model.data)){
                        if(me.$hasDirective('model')){
                            var ind = 0;
                            var mn = me.$getDirective('model').value;
                            if(mn === model.aliasName){
                                data = model.data;
                            }else{
                                //如果是parent aliasName开头，则从第二个开始往下找数据
                                var fa = mn.split('.');
                                if(model.aliasName === fa[0]){
                                    if(fa.length>1){
                                        ind=1;
                                    }
                                }
                                data = model.data;
                                //找到层级数据
                                for(var i=ind;i<fa.length&&data!==undefined;i++){
                                    try{
                                        data = data[fa[i]];
                                    }catch(e){

                                    }
                                }
                            }
                        }
                    }   
                }
                me.$model.data = data;
            }
        }
        return me.$model.data;
    }
};
