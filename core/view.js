//扩展element方法
DD.extendElementConfig = {
    $module:null,           //模块
    $containModule:null,    //是否模块容器
    $isRouterView:false,    //是否是router view
    $directives:[],         //指令集和
    $savedDoms:{},          //保存的dom集合
    $model:{},              //模型相关参数
    $attrs:{},              //带表达式的属性集合
    $exprs:[],              //表达式数组
    $isView:true,           //view标志
    $events:{},             //事件集合
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
        //构建model串
        var alias;          //别名
        var indexName;      //索引名
        var index;          //索引值
        var data;           //数据
        // 如果view自己有数据，则不再查找
        if(me.$model && me.$model.data){
            data=me.$model.data;
            alias = me.$model.aliasName;
            index = me.$model.index;
        }else if(me.$module && me.$module.data){
            var pmdlStr;
            for(var view=me; view && view.$isView && view !== me.$module.view;view=view.parentNode){
                //找到上一级model即可
                if(view.$model && view.$model.data){
                    index = view.$model.index;
                    data = view.$model.data;
                    alias = view.$model.aliasName;
                    indexName = view.$model.indexName;
                    break;
                }
            }

            if(me.$modelStr){
                if(data){ //如果父存在数据，则直接从父数据解析
                    if(DD.isObject(data)){
                        if(!DD.isEmpty(me.$modelStr)){
                            data = data.$get(me.$modelStr);
                        }
                    }
                }else{
                    data = me.$module.data.$get(me.$modelStr);    
                } 
            }
            if(!data){
                data = me.$module.data;
            }
        }
        // console.log(data);
        return {data:data,aliasName:alias,indexName:indexName,index:index};
    }
};
