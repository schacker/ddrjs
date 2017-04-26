/**
 * 插件基类
 */
(function(){

	/**
	 * 创建插件
	 */
	DD.createPlugin = function(config){

	}
	/**
	 * 销毁插件
	 */
	DD.destoryPlugin = function(config){

	}

	/**
	 * 使用插件
	 */
	DD.usePlugin = function(config){

	}


    //创建插件基类
	DD.createClass({
		name:'Plugin',
		template:null,					//模版
		templateUrl:null,				//模版文件url
		data:null,						//数据
		dataUrl:null,					//数据文件url
		//方法
		render:function(){},			//渲染
		destory:function(){},			//销毁
		init:function(){},				//初始化
		//事件
		beforeRender:function(){},		//渲染前事件
		afterRender:function(){},		//渲染后事件
		beforeDestory:function(){}, 	//销毁前事件
		afterDestory:function(){}		//销毁后事件
	});

}());