/**
 * @description 模型类
 * @author  yanglei
 * @since   1.0
 */
(function(){
    /**
     * @param	data	数据
     * 			vm		viewmodel
     * 			parent	父model
     * 			prop	绑定属性名
     *
     */
    var M = function(param){
        var me = this;
        var data = param.data;
        me.$module = param.module;
        if(DD.isObject(data)){
            me.createObjectModel(data);
        }else if(DD.isArray(data)){
            me.createArrayModel(data);
        }
        me.$module.data = data;
        return data;
    }

    //数据扩展方法
    var extendConfig = {
        $fields:{},
        set:function(key,value){
            var me = this;
            //不包含此字段
            var arr = key.split('.');
            var data = me;
            var fn,i;
            for(i=0;i<arr.length-1;i++){
                fn = arr[i];
                data = data[fn];
                if(data === undefined){
                    break;
                }
            }
            if(data === undefined){
                throw DD.Error.handle('notexist1',Dd.words.dataItem,fn);
            }
            
            if(data[arr[i]] === undefined){
                Object.defineProperty(data,arr[i],{
                    set:function(v){
                        me.$model.setProp(data,arr[i],v);
                    },
                    get:function(){
                        return me.$model.getProp(data,arr[i]);
                    }
                });
            }
            if(DD.isObject(value)){
                me.$model.createObjectModel(value);
            }else if(DD.isArray(value)){
                me.$model.createArrayModel(value);
            }
            data[arr[i]] = value;
        },
        /**
         * 获取属性值(支持级联查询)
         * @param fn    字段
         * @return      字段值
         */
        get:function(fn){
            var data = this;
            var fa = fn.split(".");
            for(var i=0;i<fa.length && data && data.$model;i++){
                model = data.$model;
                data = model.getProp(data,fa[i]);
            }
            return data;
        }
    };
    
    /**
     * 属性setter
     * @param prop  属性
     * @param value 设定值
     */
    M.prototype.setProp = function(data,prop,value){
        var me = this;
        //保存是否改变事件
        var isChange = (data.$fields[prop] !== value);
        //如果数据改变，则执行model change事件
        if(isChange === true){
            data.$fields[prop] = value;
            me.change();
        }
    }

    /**
     * 属性 getter
     * @param prop  属性名
     */

    M.prototype.getProp = function(data,prop){
        return data.$fields[prop];
    }

    M.prototype.change = function(){
        DD.Renderer.add(this.$module);
    }
    /**
     * 创建object Model
     * @param obj
     */
    M.prototype.createObjectModel = function(data){
        var me = this;
        DD.merge(data,extendConfig);
        data.$model = me;
        DD.getOwnProps(data).forEach(function(k){
            //函数不处理;$开头为保留字,不处理
            if(k[0] === '$' || DD.isFunction(data[k])){  
                return;
            }
            var v = data[k];
        
            //递归创建新model
            if(DD.isObject(data[k])){
                me.createObjectModel(data[k]);
            } 
            if(DD.isArray(data[k])){
                me.createArrayModel(data[k]);
            }else{
                Object.defineProperty(data,k,{
                    set:function(v){
                        me.setProp(data,k,v);
                    },
                    get:function(){
                        return me.getProp(data,k);
                    }
                });    
            }
            data[k] = v;
        });
    }

    /**
     * 创建数组类模型
     * @param arr   数组
     */
    M.prototype.createArrayModel = function(arr){
        var me = this;
        arr.$model = me;
        //初始化新增模型方法
        for(var i=0;i<arr.length;i++){
            var arg = arr[i];
            //递归创建新model
            if(DD.isObject(arg)){
                me.createObjectModel(arg);
            } 
            if(DD.isArray(arg)){
                me.createArrayModel(arg);
            }
        }
        //监听数组事件
        var watcher = ['push','unshift','splice','pop','shift','reverse','sort'];
       	//添加自定义事件，绑定改变事件
        watcher.forEach(function(item){
            arr[item] = function(){
                Array.prototype[item].apply(arr,arguments);
                var args=[];
                switch(item){
                    case 'push':
                        args = arguments;
                        break;
                    case 'unshift':
                        args = arguments;
                        break;
                    case 'splice':
                        //插入新元素
                        if(arguments.length>2){
                            for(var i=2;i<arguments.length;i++){
                                args.push(arguments[i]);
                            }
                        }
                        break;
                }

                //初始化新增模型方法
                for(var i=0;i<args.length;i++){
                    var arg = args[i];
                    //递归创建新model
                    if(DD.isObject(arg)){
                        me.createObjectModel(arg);
                    } 
                    if(DD.isArray(arg)){
                        me.createArrayModel(arg);
                    }
                }
                me.change();
            }
        });
    }


    DD.Model = M;
}());