/**
 * @description 事件类
 * @author      yanglei
 * @since       1.0
 */
 /**
  * 事件分为自有事件和代理事件
  * 自有事件绑定在view上
  * 代理事件绑定在父view上，存储于事件对象的events数组中
  * 事件执行顺序，先执行代理事件，再执行自有事件
  */
(function(){
    /**
     *  @param config   配置参数
     *          view        作用的element
     *          event       事件名 
     *          handler     事件处理函数
     *          delg        绑定到父view，事件代理，默认false 
     *          nopopo      禁止事件冒泡，默认false
     *          capture     事件在捕获或冒泡时触发，默认冒泡时
     */
    var Event = function(config){
        var me = this;
        me.events = [];                                 //子(代理)事件集合
        me.view = config.view;                          //视图
        me.handler = config.handler;                    //事件处理函数
        me.eventName = config.eventName;                //事件名
        me.once = config.once || false;                 //只执行1次
        me.delg = config.delg || false;                 //是否父对象代理
        me.nopopo = config.nopopo || false;             //是否允许冒泡
        me.capture = config.capture || false;           //useCapture参数
        
        if(me.delg){        //事件代理
            //如果父view不存在此命名事件，则新建一个事件
            var pview = me.view.parentNode;
            var pev;
            //父element 事件如果没有这个事件，则新建，否则直接指向父对象相应事件
            if(pview.$events[me.eventName] === undefined){
                pev = new Event({
                    eventName:me.eventName,
                    view:pview
                });
            }else{
                pev = pview.$events[me.eventName];
            }    
            pev.delegate(me);
        }else{
            me.bind();
        }
    }

    Event.prototype.fire = function(e){
        //触发为el，需要转为ev
        var me = this;
        if(me.view === undefined){
            return;
        }

        //代理事件执行
        for(var i=0;i<me.events.length;i++){
            var eobj = me.events[i];
            if(eobj.view.contains(e.target)){
                //禁止冒泡
                if(eobj.nopopo){
                    e.stopPropagation();
                }

                eobj.handler.call(me.view.$module,eobj.view,e);
                //只执行一次，释放方法
                if(eobj.once){
                    eobj.undelegate();
                }
                if(eobj.nopopo){
                    return;
                }
                break;
            }
        }
        //自有事件
        if(DD.isFunction(me.handler)){
            //禁止冒泡
            if(me.nopopo){
                e.stopPropagation();
            }
            me.handler.call(me.view.$module,me.view,e);
        }
        
        //事件只执行一次，则进行解绑
        if(me.once){  
            me.unbind();
        }
    }
        
    /**
     * 绑定事件
     * @param view      绑定的view,可不传
     * @param eventName 事件名
     */
    Event.prototype.bind=function(view){
        var me = this;
        //事件处理函数
        if(DD.isFunction(me.handleMe)){
            //先移除事件绑定
            me.view.removeEventListener(me.eventName,me.handleMe,me.capture);
        }
        me.handleMe = function(e){
            me.fire(e);
        }
        me.view.addEventListener(me.eventName,me.handleMe,me.capture);
        //存储到view的$events对象
        me.view.$events[me.eventName] = me;
    }

    Event.prototype.unbind=function(){
        var me = this;
        //释放handler
        delete me.handler;
    }
    /**
     * 代理事件
     *      events: {eobj:ev,handler:handler},eobj:事件对象，handler:事件方法
     * @param ev    需代理的事件
     */
    Event.prototype.delegate=function(ev){
        var me = this;
        var index = me.events.indexOf(ev);
        if(index !== -1){
            throw DD.Error.handle("exist",ev,DD.words.event);
        }
        //绑定事件
        me.bind();
        //制定父事件
        ev.parent = me;
        me.events.push(ev);
        //代理事件也需要在view保存事件关联
        ev.view.$events[ev.eventName] = ev;
    }
    /**
     * 取消事件代理,从父事件的事件数组删除
     * @param ev    取消代理的事件
     */
    Event.prototype.undelegate=function(){
        var me = this;
        var pev = me.parent;
        if(!pev){
            return;
        }
        var index = pev.events.indexOf(me);
        if(index === -1){
            return;
        }
        //从父事件数组移除
        pev.events.splice(index,1);
    }
    DD.Event = Event;
}());    