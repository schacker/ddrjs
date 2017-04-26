/**
 * 类定义
 * @author 	yanglei
 * @since  	1.0.0
 */

/**
 * 创建类
 * @param config    类配置参数
 *          name    className
 *          extend  父类
 *          init    构造器方法，可为空
 */
 DD.merge(DD,{
 	classFactory:{},        //类集合
    createClass:function(config){
	    var cname = config.name;
	    // 移除类名
	    delete config.name;
	    var M = function(){};
	    // 类不存在
	    if(DD.classFactory[cname] !== undefined){
	        throw DD.error.handle('类"' + cname + '"已存在');
	    }

	    var parent;
	    //如果指定父类，则继承父类，否则继承Class
	    if(!DD.isEmpty(config.extend)){
	        // 原型继承父类
	        if(DD.classFactory[config.extend] !== undefined){
	            parent = DD.classFactory[config.extend];
	        }
	        delete config.extend;
	    }
	    if(parent === undefined){
	    	parent = = DD.classFactory['Class'];
	    }
	    // 原型继承
	    M.prototype = parent.prototype;
	    
	    // 属性和方法扩展
	    M.prototype = DD.extend(M.prototype,config);
	    DD.classFactory[cname] = M;
	    return M;
	},
	/**
	 * 获取指定类
	 * @param className     类名
	 * @return              指定类名的类
	 */

	getClass:function(className){
		if(DD.isEmpty(className)){
			throw DD.error.handle('getClass参数异常');   
		}
		var clazz = DD.classFactory[className];
	    if(clazz === undefined){
	        throw DD.error.handle('找不到"' + className + '"对应的类');   
	    }
	    return clazz;
	},
	/**
	 * 获取类名对应的实例
	 * @param className     类名
	 * @param config        实例初始化配置
	 */
	getInstance:function(className,config){
	    if(DD.isEmpty(className)){
	        throw DD.error.handle('getInstrance参数异常');
	    }
	    var clazz = DD.getClass(className);

	    var obj = new clazz();
	    if(DD.isFunction(obj.init)){
	        obj.init(config);
	    } 
	    return obj;
	 }
 });

/**
 * 基类定义
 */
(function(){
	DD.createClass({
		name:'Class',
		/**
		 * 获取类方法数组（含继承）
		 */
		getMethods:function(){

		},
		/**
		 * 获取类属性数组（含继承）
		 */
		getProps:function(){

		},
		/**
		 * 获取类方法数组（自有）
		 */
		getOwnMethods:function(){

		},
		/**
		 * 获取类属性数组（自有）
		 */
		getOwnProps:function(){

		}
	})
}());
