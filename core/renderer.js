/**
 * 渲染器
 * @description 	维护模块渲染,把需要渲染的模块追加到渲染器的渲染列表，根据该模块所在的等级来确定优先级，
 *  				优先级以所在的子孙级确定，第一层为1，第二层为2，依次类推
 *
 * @author 			yanglei
 * @since  			1.0.0
 * @date   			2017-03-04
 */

(function(){	
	var Renderer = function(){
		var me = this;
		me.waitList = []; 		 //待渲染列表
		me.rendering = false;	 //正在渲染标志
		me.currentModule = null; //当前module
	}
	Renderer.prototype = {
		/**
		 * 添加到渲染列表
		 * @param module 			模块
		 */
		add:function(module){
			var me = this;
			//如果已经在列表中，不再添加
			if(me.waitList.indexOf(module) === -1){
				//计算优先级
				if(module.prio === undefined){
					var prio = 1,pm=module.parent;
					while(pm !== undefined){
						prio++;
						pm=pm.parent;
					}
				}
				module.prio=prio;
				me.waitList.push(module);
				//排序
				me.waitList.sort(function(a,b){
					return a.prio - b.prio;
				});
			}
		},
		//从列表移除
		remove:function(module){
			var ind;
			if((ind = me.waitList.indexOf(module)) !== -1){
				me.waitList.splice(ind,1);
			}
		},
		render:function(){
			var me = this;
			if(me.waitList.length === 0){
				return;
			}

			//调用队列渲染
			for(var i=0;i<me.waitList.length;i++){
				var m = me.waitList[i];
				me.currentModule = m;
				if(m.render()){
					me.waitList.splice(i--,1);
				}
			}
			
		}
	}

	//实例化
	DD.Renderer = new Renderer();
	renderLoop();
	function renderLoop(){
		DD.Renderer.render();
		// if(requestAnimationFrame){
		// 	requestAnimationFrame(renderLoop);
		// }else{
			setTimeout(renderLoop,0);
		// }
	}
}());
