/**
 * @description 原生扩展
 * @author      yanglei
 * @since       1.0.0
 * @create      2016-12-28
 */

/**
 * 为array扩展find方法(es6支持)
 */
if (!Array.prototype.find) {
  	Array.prototype.find = function(predicate) {
    	if (this == null) {
      		throw new TypeError('Array.prototype.find called on null or undefined');
    	}
	    if (typeof predicate !== 'function') {
	      	throw new TypeError('predicate must be a function');
	    }
	    var list = Object(this);
	    var length = list.length >>> 0;
	    var thisArg = arguments[1];
	    var value;

	    for (var i = 0; i < length; i++) {
	      value = list[i];
	      if (predicate.call(thisArg, value, i, list)) {
	        return value;
	      }
	    }
    	return undefined;
  	}
};
'use strict';

/**
 * @description 基础服务库
 * @author      yanglei
 * @since       1.0.0
 * @create      2016-09-28
 */
var DDRAppConfig = {};
var DD = {
    //唯一主键
    generatedId:1,
    genId:function(){
        return this.generatedId++;
    },
    
    /******对象相关******/

    /**
     * 扩展对象,并返回
     */
    extend:function(){
        var args = arguments;
        var reto = {};
        for(var i=0;i<args.length;i++){
            if(DD.isObject(args[i])){
                var obj = args[i];
                for(var prop in obj){
                    if(DD.isObject(obj[prop])){
                        if(DD.isObject(reto[prop])){
                            DD.merge(reto[prop],obj[prop]);
                        }else{
                            reto[prop] = DD.merge({},obj[prop]);
                        }
                    }else{
                        reto[prop] = obj[prop];
                    }
                }
            }
        }
        return reto;
    },

    merge:function(obj1,obj2){
        if(typeof obj1 !== 'object'){
            throw DD.Error.handle('invoke','DD.merge',0,'object');
        }
        if(typeof obj2 !== 'object'){
            throw DD.Error.handle('invoke','DD.merge',1,'object');
        }
        //用于存储已复制的对象
        var copyed = [];
        merge(obj1,obj2);
        return obj1;
        
        function merge(obj1,obj2){
            //复制过的对象不重复复制
            if(copyed.indexOf(obj2) !== -1){
                return obj2;
            }
            //记录复制过的对象属性
            copyed.push(obj2);
            //数组，处理每个数组元素
            if(DD.isArray(obj1) && DD.isArray(obj2)){
                obj2.forEach(function(item,i){
                    if(DD.isArray(item)){
                        obj1[i] = merge([],item);    
                    }else if(DD.isObject(item)){
                        obj1[i] = merge({},item);
                    }else{
                        obj1[i] = item;
                    }
                });
            }else {  //对象，处理每个属性
                for(var o in obj2){
                    //凡是出现parent，则直接复制，否则可能会
                    if(DD.isObject(obj2[o])){       //处理对象
                        if(!DD.isObject(obj1[o])){
                            obj1[o] = {};
                        }
                        merge(obj1[o],obj2[o]);
                    }else if(DD.isArray(obj2[o])){  //处理数组
                        if(!DD.isArray(obj1[o])){
                            obj1[o] = [];
                        }
                        obj2[o].forEach(function(item,i){
                            var ro;
                            if(DD.isObject(item)){
                                ro = merge({},item);
                            }else if(DD.isArray(item)){
                                ro = merge([],item);
                            }else{
                                ro = item;
                            }
                            obj1[o][i] = ro;
                        });
                    }else{
                        obj1[o] = obj2[o];
                    }
                }
            }
            return obj1;
        }
    },

    /**
     * 把obj2对象所有属性赋值给obj1
     */
    assign:function(obj1,obj2){
        if(Object.assign){
            Object.assign(obj1,obj2);
        }else{
            DD.getOwnProps(obj2).forEach(function(p){
                obj1[p] = obj2[p];
            });    
        }
    },

    /**
     * 获取对象自有属性
     */
    getOwnProps:function(obj){
        return Object.getOwnPropertyNames(obj);
    },
    /**************对象判断相关************/
    /**
     * 是否为函数
     * @param foo   检查的对象
     * @return true/false
     */
    isFunction:function(foo){
        return foo !== undefined && foo !== null && foo.constructor === Function;
    },
    /**
     * 是否为数组
     * @param obj   检查的对象
     * @return true/false
     */
    isArray:function(obj) {
        return obj !== undefined && obj !== null && obj.constructor === Array;
    },

    /**
     * 是否为对象
     * @param obj   检查的对象
     * @return true/false
     */
    isObject: function(obj) {
        return obj !== null && obj !== undefined && obj.constructor === Object;
    },

    /**
     * 判断是否为整数
     */
    isInt: function (x) {
        return Number.isInteger(x);
    },

    /**
     * 判断是否为字符串
     */
    isString: function(str){
        return typeof str === 'string';
    },

    /**
     * 对象/字符串是否为空
     * @param obj   检查的对象
     * @return true/false
     */
    isEmpty:function(obj){
        if(obj === null || obj === undefined)
            return true;
        var tp = typeof obj;
        if(DD.isObject(obj)){
            var keys = Object.keys(obj);
            if(keys !== undefined){
                return keys.length === 0;
            }
        }else if(tp === 'string'){
            return obj === '';
        }
        return false;
    },


   /**********dom相关***********/
    /**
     * 获取dom节点
     * @param selector  选择器
     * @param findAll   是否获取所有，默认为false
     * @param pview     父对象
     * @return element/null 或 element数组/[]
     */
    get:function(selector,findAll,pview){
        pview = pview || document;
        if(findAll === true){
            return pview.querySelectorAll(selector);
        }
        return pview.querySelector(selector);
    },

    /**
     * 追加子节点
     * @param el    父element
     * @param dom   要添加的dom节点或dom串
     */
    append:function(el,dom){
        if(DD.isNode(dom)){
            el.appendChild(dom);
        }else if(DD.isString(dom)){
            var div = DD.newEl('div');
            div.innerHTML = dom;
            DD.transChildren(div,el);
        }
    },
    /**
     * 是否为element
     * @param el 传入的对象
     * @return true/false
     */
    isEl:function(el){
        return el !== undefined && el !== null && el.nodeType === Node.ELEMENT_NODE;
    },

    /**
     * 是否为node
     * @param node 传入的对象
     * @return true/false
     */
    isNode:function(node){
        return node !== undefined && node !== null && (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);  
    },
    /**
     * 复制节点，并复制view属性
     * @param el    待克隆 el
     */
    cloneNode:function(el){
        if(!DD.isNode(el)){
            throw DD.Error.handle('invoke','DD.cloneNode',0,'Node');
        }
        var node;
        node = el.cloneNode(true);
        DD.copyProp(node,el);
        return node;
    },

    /**
     * 复制node自定义属性
     * @param nod1  目标node
     * @param nod2  源node
     */
    copyProp:function(nod1,nod2){
        var po = {};
        var notCloneArr = ['$model','$module','$events'];
        //复制自定义属性
        DD.getOwnProps(nod2).forEach(function(p){
            if(p[0] === '$'){
                var flag = false;
                for(var i=0;i<notCloneArr.length;i++){
                    if(p === notCloneArr[i]){
                        flag = true;
                        break;
                    }
                }
                if(!flag){
                    po[p] = nod2[p];
                }
            }
        });
        DD.merge(nod1,po);
        //$model要单独处理
        nod1.$module = nod2.$module;
        //先把事件清空
        nod1.$events = {};
        //复制model
        if(nod2.$model){
            nod1.$model = {};
            DD.getOwnProps(nod2.$model).forEach(function(item){
                nod1.$model[item] = nod2.$model[item];
            });
        }
        //处理事件
        if(!DD.isEmpty(nod2.$events)){
            DD.getOwnProps(nod2.$events).forEach(function(e){
                var eo = nod2.$events[e];
                if(eo instanceof DD.Event){
                    var module = eo.module;
                    eo.view = nod1;    
                    delete eo.module;
                    var p = DD.merge({},eo);
                    new DD.Event(p);
                }
            });
        }
        //处理子孙节点
        for(var i=0;i<nod1.childNodes.length;i++){
            DD.copyProp(nod1.childNodes[i],nod2.childNodes[i]);
        }
    },
    /**
     * 获取属性数组
     * @param   el  element
     * @param   reg 正则式
     * @return  属性数组
     */
    getAttrs:function(el,reg){
        if(!DD.isEl(el)){
            throw DD.Error.handle('invoke','DD.getAtrs',0,'element');
        }
        var arr = [];
        for(var i=0;i<el.attributes.length;i++){
            var attr = el.attributes[i];
            if(reg.test(attr.name)){
                arr.push(attr);
            }
        }
        return arr;
    },

    /**
     * 通过属性值获取属性列表
     * @param el    element
     * @param reg   正则表达式
     */
    getAttrsByValue:function(el,reg){
        if(!DD.isEl(el)){
            throw DD.Error.handle('invoke','DD.getAttrsByValue',0,'element');
        }
        if(!reg instanceof RegExp){
            throw DD.Error.handle('invoke','DD.getAttrsByValue',1,'RegExp');   
        }
        var arr = [];

        for(var i=0;i<el.attributes.length;i++){
            var attr = el.attributes[i];
            if(reg.test(attr.value)){
                arr.push(attr);
            }
        }
        return arr;
    },
    /**
     * 复制element 属性
     * @param srcEl     源element
     * @param dstEl     目标element
     */
    copyAttrs:function(srcEl,dstEl){
        if(!DD.isEl(srcEl)){
            throw DD.Error.handle('invoke','DD.copyAttrs',0,'element');
        }
        if(!DD.isEl(dstEl)){
            throw DD.Error.handle('invoke','DD.copyAttrs',1,'element');
        }
        for(var i=0;i<srcEl.attributes.length;i++){
            var attr = srcEl.attributes[i];
            dstEl.setAttribute(attr.name,attr.value);
        }
    },
    /**
     * 新建dom
     * @param tagName   标签名
     * @param config    属性集合
     * @param text      innerText
     * @return 新建的elelment
     */
    newEl:function(tagName,config,text){
        if(!DD.isString(tagName) || DD.isEmpty(tagName)){
            throw DD.Error.handle('invoke','DD.newEl',0,'string');   
        }
        var el = document.createElement(tagName);
        if(DD.isObject(config)){
            DD.attr(el,config);
        }else if(DD.isString(text)){
            el.innerHTML = text;
        }
        return el;
    },
    /**
     * 把srcNode替换为nodes
     * @param srcNode       源dom
     * @param nodes         替换的dom或dom数组
     * @param srcPropCopy   是否保留原有dom的扩展view参数，缺省true
     */
    replaceNode:function(srcNode,nodes,srcPropCopy){
        if(!DD.isNode(srcNode)){
            throw DD.Error.handle('invoke','DD.replaceNode',0,'Node');
        }
        
        if(!DD.isNode(nodes) && !DD.isArray(nodes)){
            throw DD.Error.handle('invoke1','DD.replaceNode',1,'Node','Node Array');
        }

        var pnode = srcNode.parentNode;
        var bnode = srcNode.nextSibling;
        if(pnode === null){
            return;
        }
        pnode.removeChild(srcNode);
        if(!DD.isArray(nodes)){
            nodes = [nodes];
        }
        
        nodes.forEach(function(node){
            if(bnode === undefined || bnode === null){
                pnode.appendChild(node);
            }else{
                pnode.insertBefore(node,bnode);
            }
            if(srcPropCopy !== false){
                srcPropCopy = true;
            }
            // 扩展node处理 参数复制
            if(srcPropCopy && srcNode.$isView){
                DD.copyProp(node,srcNode);
            }
        });
    },
    /**
     * 在srcNode后面插入newNode,如果srcNode无效，则插入到第一个
     * @param newNode   新节点或数组
     * @param oldNode   旧节点
     */
    insertAfter:function(newNode,srcNode,pNode){
        var me = this;
        if(!DD.isNode(newNode)){
            throw DD.Error.handle('invoke','DD.insertAfter',0,'Node');
        }
        if(!DD.isNode(srcNode) && !DD.isNode(pNode)){
            throw DD.Error.handle('invoke2','DD.insertAfter',1,2,'Node');
        }
        var bNode=null;
        //如果srcNode不存在，则添加在第一个位置
        if(srcNode === undefined || srcNode === null){
            bNode = pNode.firstChild;
        }else{
            pNode = srcNode.parentNode;
            bNode = srcNode.nextSibling;
        }
        if(!DD.isNode(pNode)){
            return;
        }
        if(bNode === null){
            if(DD.isArray(newNode)){
                newNode.forEach(function(n){
                    if(me.isEl(n)){
                        pNode.appendChild(n);
                    }
                });
            }else{
                pNode.appendChild(newNode);
            }
        }else{
            if(DD.isArray(newNode)){
                newNode.forEach(function(n){
                    if(me.isEl(n)){
                        pNode.insertBefore(n,bNode);
                    }
                });
            }else{
                pNode.insertBefore(newNode,bNode);
            }
        }
    },

    /**
     * 清空子节点
     * @param el
     */
    empty:function(el){
        var me = this;
        if(!me.isEl(el)){
            throw DD.Error.handle('invoke','DD.empty',0,'Element');
        }
        var nodes = el.childNodes;
        for(var i=nodes.length-1;i>=0;i--){
            el.removeChild(nodes[i]);
        }
    },
    /**
     * 删除自己
     * @param node
     */
    remove:function(node){
        var me = this;
        if(!me.isNode(node)){
            throw DD.Error.handle('invoke','DD.remove',0,'Node');
        }
        if(node.parentNode !== null){
            node.parentNode.removeChild(node);
        }
    },
    /**
     * 复制子节点
     * @param el    element
     * @return  返回复制的子节点数组
     */
    copyChildren:function(el){
        var me = this;
        if(!me.isEl(el)){
            throw DD.Error.handle('invoke','DD.copyChildren',0,'Element');
        }
        var nodes = el.childNodes;
        var arr = [];
        for(var i=nodes.length-1;i>=0;i--){
            arr.push(nodes[i]);
        }
        return arr;
    },

    /**
     * 转移孩子节点
     * @param srcEl 源父节点
     * @param dstEl 目的父节点
     */
    transChildren:function(srcEl,dstEl){
        var me = this;
        if(!me.isEl(srcEl)){
            throw DD.Error.handle('invoke','DD.copyChildren',0,'Element');
        }
        if(!me.isEl(dstEl)){
            throw DD.Error.handle('invoke','DD.copyChildren',1,'Element');
        }
        //通过fragment 转移，减少渲染
        var frag = document.createDocumentFragment();
        for(;srcEl.childNodes.length>0;){
            frag.appendChild(srcEl.childNodes[0]);
        }
        dstEl.appendChild(frag);
    },

    /**
     * 获取／设置属性
     * @param el    element
     * @param param 属性名，设置多个属性时用对象
     * @param value 属性值，获取属性时不需要设置
     */
    attr:function(el,param,value){
        var me = this;
        if(!me.isEl(el)){
            throw DD.Error.handle('invoke','DD.attr',0,'Element');
        }
        if(DD.isEmpty(param)){
            throw DD.Error.handle('invoke','DD.attr',1,'string','object');   
        }
        if(value === undefined || value === null){
            if(DD.isObject(param)){ //设置多个属性
            DD.getOwnProps(param).forEach(function(k){
                    el.setAttribute(k,param[k]);
                });
            }else if(DD.isString(param)){ //获取属性
                return el.getAttribute(param);
            }
        }else { //设置属性
            el.setAttribute(param,value);
        }
    },
    /**
     * 设置样式
     * @param el    element
     * @param name  样式名，设置多个样式时用对象
     * @param value 样式值，获取样式时不需要设置
     */
    css:function(el,name,value){
        var me = this;
        if(!me.isEl(el)){
            throw DD.Error.handle('invoke','DD.css',0,'Element');
        }
        if(DD.isEmpty(name)){
            throw DD.Error.handle('invoke1','DD.css',1,'string','object');   
        }
        var compStyle = document.defaultView.getComputedStyle(el,null);
        if(value === undefined || value === null){
            if(DD.isObject(name)){ //设置多个属性
                Object.getOwnPropertyNames(name).forEach(function(k){
                    if(DD.cssconfig !== undefined && DD.cssconfig[k] !== undefined){
                        //遍历属性名数组
                        DD.cssconfig[k].forEach(function(sn){
                             el.style[sn] = name[k];
                        });
                    }else{
                        el.style[k] = name[k];
                    }
                });
            }else{ //获取样式
                return compStyle[name];
            }
        }else { //设置属性
            if(DD.$cssconfig !== undefined && DD.$cssconfig[name] !== undefined){
                //遍历属性名数组
                DD.$cssconfig[name].forEach(function(sn){
                     el.style[sn] = value;
                });
            }else{
                el.style[name] = value;
            }
        }
    },
    /**
     * 添加class
     * @param el		element
     * @param cls	类名
     */
    addClass:function(el,cls){
        if(!DD.isEl(el)){
            throw DD.Error.handle('invoke','DD.css',0,'Element');
        }
        if(DD.isEmpty(cls)){
            throw DD.Error.handle('invoke','DD.css',1,'string');   
        }

		var cn = el.className.trim();
		if(DD.isEmpty(cn)){
			el.className = cls;
		}else{
			var arr = cn.split(/\s+/);
			//遍历class数组，如果存在cls，则不操作
			for(var i=0;i<arr.length;i++){
				if(arr[i] === cls){
					return;
				}
			}
			//追加cls
			arr.push(cls);
			el.className = arr.join(' ');
		}
    },
    /**
     * 移除cls
     * @param el		element
     * @param cls	类名
     */
    removeClass:function(el,cls){
    	if(!DD.isEl(el)){
            throw DD.Error.handle('invoke','DD.css',0,'Element');
        }
        if(DD.isEmpty(cls)){
            throw DD.Error.handle('invoke','DD.css',1,'string');   
        }

		var cn = el.className.trim();
		if(!DD.isEmpty(cn)){
			var arr = cn.split(/\s+/);
			//遍历class数组，如果存在cls，则移除
			for(var i=0;i<arr.length;i++){
				if(arr[i] === cls){
					arr.splice(i,1);
					el.className = arr.join(' ');
					return;
				}
			}
		}
    },

    /******日期相关******/
    /**
     * 日期格式化
     * @param srcDate   原始日期
     * @param format    日期格式
     * @return          日期串
     */
    formatDate:function(srcDate,format){
        if(DD.isString(srcDate)){
            //排除日期格式串,只处理时间戳
            if(srcDate.indexOf('/') !== -1 && srcDate.indexOf('-') !== -1 && srcDate.indexOf(':') !== -1){
                try{
                    srcDate = parseInt(srcDate);
                }catch(e){}    
            }
        }
        //得到日期
        var srcDate = new Date(srcDate);
        // invalid date
        if(isNaN(srcDate.getDay())){
            throw DD.Error.handle('invoke','DD.formatDate',0,'date string','date');
        }

        var o = {
            "M+" : srcDate.getMonth()+1, //月份
            "d+" : srcDate.getDate(), //日
            "h+" : srcDate.getHours()%12 === 0 ? 12 : srcDate.getHours()%12, //小时
            "H+" : srcDate.getHours(), //小时
            "m+" : srcDate.getMinutes(), //分
            "s+" : srcDate.getSeconds(), //秒
            "q+" : Math.floor((srcDate.getMonth()+3)/3), //季度
            "S" : srcDate.getMilliseconds() //毫秒
        };
        var week = {
            "0" : "日",
            "1" : "一",
            "2" : "二",
            "3" : "三",
            "4" : "四",
            "5" : "五",
            "6" : "六"
       };
       //年份单独处理
       if(/(y+)/.test(format)){
           format=format.replace(RegExp.$1, (srcDate.getFullYear()+"").substr(4 - RegExp.$1.length));
       }
       //月日
       DD.getOwnProps(o).forEach(function(k){
           if(new RegExp("("+ k +")").test(format)){
               format = format.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
           }
       });

       //星期
       if(/(E+)/.test(format)){
           format=format.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "") + week[srcDate.getDay() + ""]);
       }
       return format;
    },

    /**
     * 日期串转日期
     * @param dateStr   日期串
     * @return          日期
     */
    toDate:function(dateStr){
        var date1;
        try{
            date1 = new Date(Date.parse(dateStr));
        }catch(e){
            throw DD.Error.handle('invoke','DD.toDate',0,'date string');
        }

        //处理非标准日期串
        //14位
        if(isNaN(date1) || isNaN(date1.getDay())){
            if(dateStr.length === 14){
                dateStr = dateStr.substr(0,4) + '/' + dateStr.substr(4,2) + '/' + dateStr.substr(6,2) + ' ' +
                          dateStr.substr(8,2) + ':' + dateStr.substr(10,2) + ':' + dateStr.substr(12);
                date1 = new Date(Date.parse(dateStr));
            }else if(dateStr.length === 8){ //8位
                dateStr = dateStr.substr(0,4) + '/' + dateStr.substr(4,2) + '/' + dateStr.substr(6,2);
                date1 = new Date(Date.parse(dateStr));
            }
        }
        return date1;
    },
    /******字符串相关*****/
    /**
     * 编译字符串
     * @param str 待编译的字符串
     * @param args1,args2,args3,... 待替换的参数
     * @return 转换后的消息
     */
    compileStr:function(str){
        var reg = new RegExp(/\{.+?\}/);
        var arr = [];
        var r;
        var args = arguments;
        while((r=reg.exec(str))!==null){
            var rep;
            var sIndex = r[0].substr(1,r[0].length-2);
            var pIndex = parseInt(sIndex)+1;
            if(args[pIndex] !== undefined){
                rep = args[pIndex];
            }else{
                rep = '';
            }
            str = str.replace(reg,rep);
        }
        return str;
    },
    /**
     * json解析
     * @param jsonStr: 待解析json串
     * @return json object
     */
    parseJson:function(jsonStr){
        jsonStr = jsonStr.trim();
        var arr = jsonStr.substr(1,jsonStr.length-2).split(',');
        var repStr = "$$DD_rep_str";
        
        var obj = {};
        var reg1 = new RegExp(/\'/g);
        var reg2 = new RegExp(/\"/g);
        
        arr.forEach(function(item){
            var a = item.split(':');
            if(a[0] !== '"' && a[0] !== "'" || a[a.length-1] !== '"' && a[a.length-1] !== "'"){
                var key = a[0].replace(reg1,'\\\'');
                var v = a[1];
                var l = v.length;
                //去掉两端引号
                if(l>2 && (v[0] === '"' && v[l-1] === '"' || v[0] === '"' && v[l-1] === '"')){
                    v = v.substr(1,l-2);
                }
                obj[key] = v;
            }
        });  
        return obj;
    }

}
/**
 * 网络服务库
 */

DD.http = {
    /**
     * get方式请求资源
     * @param config
     *          url:   请求url,
     *          params:请求对象
     *          callback: 回调函数
     *          timeout:  超时时间(毫秒)
     * callback 传递参数 ERR-1 服务器无响应 ERR-2 超时无响应  ERR-3 服务器响应错误  其它:正常返回
     */
    get:function(config){


    },

    /**
     * post方式获取资源
     * @param config
     *          url:   请求url,
     *          params:请求对象
     *          callback: 回调函数
     *          timeout:  超时时间(毫秒)
     * callback 传递参数 ERR-1 服务器无响应 ERR-2 超时无响应  ERR-3 服务器响应错误  其它:正常返回
     */
    post:function(config){

    },
    /**
     * 异步加载资源(多个)资源
     * 请求
     */
    load:function(config){
		var me = this;
		me.request(config);
    },
    /**
     * 请求
     * @param config
     *          url:   		请求url,
     *          reqType: 	请求类型 GET、POST
     *          mime	:	 	mime 类型
     *          params:		请求对象
     *          successFunc: 成功函数
     *          errorFunc:   失败函数
     *          timeoutFunc: 超时函数
     *          timeout:  	超时时间(毫秒)
     * callback 传递参数 ERR-1 服务器无响应 ERR-2 超时无响应  ERR-3 服务器响应错误  其它:正常返回
     */
    request:function(config){
        var req = new XMLHttpRequest();
        if(DD.isEmpty(config.url)){
            throw DD.error.handle("load 参数错误");
        }
        //设置mime
        var mime = config.type || 'text';
        switch(mime){
            case 'html':
                req.overrideMimeType('text/html;charset=utf-8');
                break;
            case 'json':
                req.overrideMimeType('text/javascript;charset=utf-8');
                break;
            case 'js':
                req.overrideMimeType('text/javascript;charset=utf-8');
                break;
            case 'xml':
                req.overrideMimeType('text/xml;charset=utf-8');
                break;
            default:
                req.overrideMimeType('text/plain;charset=utf-8');
        }

        //网络请求时间
        req.timeout = config.timeout || 0;

        /**
         * 回调函数处理
         */
        //成功函数
        if(typeof config.successFunc === 'function'){
            req.onload = function(e){
                switch(req.status){
                    case 200:
                        var r = req.responseText;
                        switch(config.type){
                            case 'json':
                                r = JSON.parse(r);
                                break;
                            case 'js':
                                var script = DD.newEl('script');
                                script.innerHTML = r;
                                var head = DD.get('head');
                                head.append(script);
                                script.innerHTML = '';
                                // 保留script标签的path属性
                                script.src = config.url;
                                r = script;
                                break;
                        }
                        config.successFunc.call(req,r);   
                        break; 
                    default:    //服务器异常
                        if(DD.isFunction(config.errorFunc)){
                            config.errorFunc.call(req,req.status);
                        }                
                }
                
            }
        }

        //异常函数
        if(DD.isFunction(config.errorFunc)){
            req.onerror = config.errorFunc;
        }

        //超时函数
        if(DD.isFunction(config.timeoutFunc)){
            req.ontimeout = config.timeoutFunc;
        }

        var reqType = config.reqType||'GET';
        //参数
        var pa=null;
        if(DD.isObject(config.params)){
        		var ar = [];
        		Object.getOwnPropertyNames(config.params).forEach(function(key){
        			ar.push(key + '=' + config.params[key]);
        		});
        		pa = ar.join('&');
        }

        var url = config.url;

        //发送请求
        switch(reqType){

        		case 'GET':
        			if(pa !== null){
        				if(url.indexOf('?') !== -1){
        					url += '&' + pa;
        				}else{
        					url += '?' + pa;
        				}
        			}
        			req.open(reqType,url,true);
        			req.send(null);
        			break;
        		case 'POST':
        			req.setRequestHeder("Content-Type","application/x-www-form-urlencoded;charset=UTF-8");
        			req.open(reqType,url,true);
        			req.send(pa);
        			break;
        }
    }
};





/**
 * 系统配置
 * 1.配置app路径
 * 2.配置app view  路径
 * 3.配置app model 路径
 * 4.配置app viewmodel 路径
 */

DD.config = {
	renderTick:200,			//渲染时间间隔
    appPath:''				//应用加载默认路径
};


/**
 * @description 异常处理类
 * @author      yanglei
 * @since       1.0.0
 */

DD.Error = {
   /**
    * 按照消息编号进行处理并返回消息内容
    * @param 异常名
    * @param args1,args2,args3,... 待替换的参数
    * @return 转换后的消息
    */
   
   handle:function(errname){
      var reg = new RegExp(/\{.+?\}/);
      var msg = DD.ErrorMsgs[errname];
        if(msg === undefined){
          return "未知错误";
        }
        var args = [msg];
      for(var i=1;i<arguments.length;i++){
        args.push(arguments[i]);
      }
      return DD.compileStr.apply(DD,args);
   }
};
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
'use strict';

/**
 * 表达式
 * @author  yanglei
 * @since   1.0.0
 */

 /**
  * 表达式说明
  * 1 表达式数据类型包括字段、数字、字符串、函数
  * 2 运算符包括 '(',')','*','/','|','+','-','>','<','>=','<=','==','===','&&','||'，其中'|' 表示过滤器
  * 3 函数参数类型包括 字段、数字、字符串，所有参数不能含有过滤器
  * 4 表达式优先级仅低于(),如果表达式前需要计算，需要样式如 (x*y)|currency:$
  */

(function(){
    var M = function(){
    
    }
    /**
     * 处理
     * @param exprArr   表达式数组
     * @param models    模型数组
     * @param alias     别名
     * @return          处理结果
     */
    M.prototype.handle = function(module,exprArr,datas,alias){
        var me = this;
        var result = '';

        if(!DD.isArray(exprArr)){
            return;
        }
        exprArr.forEach(function(item){
            if(item.type === 'string'){
                result += item.src;
            }else{
                result += me.cacExpr(module,item.src,datas,alias);
            }
        });
        return result;
    }

    /**
     * 初始化表达式串
     * @param exprStr   表达式串
     * @param view      关联view
     */
    M.prototype.initExpr = function(exprStr,view){
        var me = this;
        var reg = new RegExp(/\{\{.+?\}\}/g);
        var indexes = [];//save reg string loc
        var result = [];
        var ind = 0;
        var r;
        while((r = reg.exec(exprStr)) !== null){
            if(r.index>ind){
                result.push({
                    type:'string',
                    src:exprStr.substring(ind,r.index)
                });
            }
            result.push({
                type:'expr',
                src:me.initOne(r[0].substring(2,r[0].length-2),view)
            });
            
            ind = r.index + r[0].length;
        }
        return result;
    }

    /**
     * 初始化单个表达式
     * @param expStr    表达式串
     * @param view      表达式对应的view
     * @return          stacks:0 计算源  1运算符
     */
    M.prototype.initOne = function(expStr,view){
        //运算符
        var cacSign = ['(',')','!','|','*','/','+','-','>','<','>=','<=','==','===','&&','||','%'];
        
        //函数匹配正则式
        var regFun = new RegExp(/[\w$][\w$\d\.]*\(.*?\)/);
        //字符串正则式
        var regStr = new RegExp(/(\'.+?\')|(\".+?\")/);

        //函数替换串前缀
        var funPrev = '$DDfun_rep_';
        //字符串替换串前缀
        var strPrev = '$DDstr_rep_';
        //函数替换数组
        var funArr = [];
        //字符串替换数组
        var strArr = [];
        //替换起始索引
        var repIndex = 0;
        var r;
        
       
        //1 替换字符串
        while((r=regStr.exec(expStr)) !== null){
            //串替换
            expStr = expStr.replace(r[0],(strPrev + repIndex++));
            strArr.push(r[0]);
        }

        //2 替换函数 如：foo(a,b,...)  Math.round(a) 等
        repIndex = 0;
        while((r=regFun.exec(expStr)) !== null){
            //串替换
            expStr = expStr.replace(r[0],(funPrev + repIndex++));
            funArr.push(r[0]);
        }

        //构建表达式堆栈
        var stacks = genStack(expStr);
        var stack1 = [];    //最终的运算结果堆栈
        
        //还原运算字段构建
        stacks[0].forEach(function(item,ii){
            //还原函数
            for(var i=0;i<funArr.length;i++){
                if(item.indexOf(funPrev + i) !== -1){
                    var ind1 = funArr[i].indexOf('(');
                    var fn = funArr[i].substr(0,ind1).trim();
                    var pm = getParams(funArr[i]);
                    stack1.push({
                        type:'function',    //函数
                        fn: fn,             //函数名
                        params:pm           //参数数组
                    });
                    return;
                }
            }

            //还原字符串
            for(var i=0;i<strArr.length;i++){
                if(item.indexOf(strPrev + i ) !== -1){
                    stack1.push({
                        type:'string',                          //字符串
                        src:item.replace(strPrev+i,strArr[i])   //源
                    });
                    return;
                }   
            }

            
            if(item === ""){
                stack1.push({
                    type:'blank',       //数字
                    src:item            //源
                });
            }else if(!isNaN(item)){
                stack1.push({
                    type:'number',      //空串
                    src:item            //源
                });
            }else{
                if(item === "true" || item === "false"){
                    stack1.push({
                        type:'string',
                        src:item
                    });
                }else{
                    stack1.push({
                        type:'field',       //字段
                        src:item            //源
                    });    
                }
            }
        });

        stacks[0] = stack1;
        
        //处理过滤器
        initFilter();
        //返回堆栈数组 0: 计算源数组  2运算符数组
        return stacks;

        /**
         * 表达式堆栈构建
         * @param s 待分解的字符串
         * @return 表达式 和 操作符堆栈
         */
        function genStack(s){
            var stack1=[],stack2=[];
            var index1 = 0;
            for(var ii=0;ii<s.length;ii++){
                for(var i=cacSign.length-1;i>=0;i--){
                    var len = cacSign[i].length;
                    if(s.substr(ii,len) === cacSign[i]){
                        stack1.push(s.substr(index1,ii-index1).trim());
                        stack2.push(cacSign[i]);
                        ii += len-1;        
                        index1 = ii+1;      //重新定位下次开始位置
                        break;
                    }
                }
            }
            //最后一个
            if(index1 < s.length){
                stack1.push(s.substr(index1).trim());
            }
            return[stack1,stack2];
        }

        /**
         * 获取函数参数
         * @param funStr    函数串(带参数)
         * @return  参数数组{type:'string'.src:**} {type:'number',src:**} {type:'feild',src:**}
         */
        function getParams(funStr){
            var params = [];
            var pas = funStr.substring(funStr.indexOf('(')+1,funStr.lastIndexOf(')'));
            if(pas !== '' && (pas=pas.trim())!==''){
                //参数分隔
                var pa = pas.split(',');
                //参数还原
                pa.forEach(function(p){
                    p = p.trim();
                    //还原字符串
                    for(var i=0;i<strArr.length;i++){
                        if(strPrev + i === p){
                            params.push({
                                type:'string',
                                src:strArr[i]
                            });
                            return;
                        } 
                    }
                    var pm;
                    //数字
                    if(!isNaN(p)){
                        pm = {
                            type:'number',
                            src:p
                        }
                    }else{  //字段
                        pm = {
                            type:'field',
                            src:p
                        }
                    }
                    params.push(pm);
                    
                    //绑定view 到模型
                    if(view !== undefined && pm.type === 'field'){
                        bindOne(pm);
                    }
                });
            }
            return params;
        }

        /**
         * 初始化过滤器
         */
        function initFilter(){
            for(var i=0;i<stacks[1].length;i++){
                //回溯过滤器前符号
                if(stacks[1][i] === '|'){
                    var pa = {
                        type:'filter',
                        //存储相邻两个计算域
                        exprs:[stacks[0][i],stacks[0][i+1]],
                        signs:[]
                    };
                    var backIndex = i;
                    var sign = stacks[1][i-1];

                    if(sign === ')'){
                        //替换括号前的空串并删除计算源i
                        pa.exprs[0] = stacks[0][i-1]; 
                        stacks[0].splice(i);
                        for(var j=i-2;j>=0;j--){
                            if(stacks[1][j] === '('){
                                backIndex = j;
                                break;
                            }
                        }
                        pa.signs.unshift(sign);

                        // 处理表达式运算符和运算源
                        for(var j=i-2;j>=backIndex;j--){
                            pa.exprs.unshift(stacks[0][j]);
                            pa.signs.unshift(stacks[1][j]);
                        }
                    }
                    //改变计算源数组
                    stacks[0].splice(backIndex,i-backIndex+2,pa);
                    //删除计算符数组元素
                    stacks[1].splice(backIndex,i-backIndex+1);
                    //修改索引
                    i=backIndex;
                }
            }
        }
    }

    /**
     * 计算表达式
     */
    M.prototype.cacExpr=function(module,stacks,datas,alias){
        var expr = "";
        stacks[0].forEach(function(item,ii){
            var v = cacOne(item);
            var sign = '';    
            //添加运算符
            if(stacks[1].length > ii && stacks[1][ii] !== ''){
                //如果是字符串，同时需要进行运算,需要给字符串加上 引号
                if(DD.isString(v)){
                    if(v.indexOf("'") !== -1){
                        v = '"' + v + '"';
                    }else {
                        v = "'" + v + "'";
                    }
                }
                sign = stacks[1][ii];
            }
            expr += v + sign;
        });
        //带有运算法，需要进行计算
        if(stacks[1].length > 0){
            try{
                if(expr !== ''){
                    expr = eval(expr);    
                }
            }catch(e){
            }
        }
        
        return expr;

        /**
         *  调用函数对象
         */
        function invoke(funObj){
            var foo;
            var isSystem = false;
            if(funObj.fn.indexOf('.') === -1){  //不带点，则绑定为模块方法
                foo = module.methodFactory.get(funObj.fn);
                if(foo === undefined){
                    throw DD.Error.handle('notexist1',DD.words.module+DD.words.method,funObj.fn);
                }
            }else{
                //得到js内置函数
                isSystem = true;
                foo = eval(funObj.fn);
            }

            //参数构建
            var pa = [];
            funObj.params.forEach(function(p){
                switch(p.type){
                    case 'field':
                        var v = getValue(datas,p.src,alias);
                        if(v === undefined || v === null){
                            throw DD.Error.handle('notexist1',DD.words.dataItem,p.src);
                        }
                        pa.push(v);
                        break;
                    case 'number':
                        pa.push(eval(p.src));
                        break;
                    default:
                        pa.push(p.src);    
                }
            });

            //函数调用
            if(isSystem){
                return foo.apply(null,pa);
            }else{
                return foo.apply(module,pa);
            }
        }

        /*
         * 处理过滤器
         * @param filterObj 过滤器对象
         * @return  过滤器计算结果
         */
        function filter(filterObj){
            var exprs = filterObj.exprs;
            var signs = filterObj.signs;
            var src;
            var r = '';
            for(var i=0;i<exprs.length-1;i++){
                r += cacOne(exprs[i]);
                if(i<signs.length){
                    r += signs[i];
                }
            }
            if(signs.length>0){
                try{
                    r = eval(r);
                }catch(e){

                }
            }
            //返回过滤器处理结果
            return DD.Filter.handle(module,r,exprs[i].src);
        }

        /**
         * 获取一个计算源结果
         * @param item  计算源对象
         * @return      返回结果
         */
        function cacOne(item){
            switch(item.type){
                case 'field':
                    var fn = item.src;
                    var v = getValue(datas,fn,alias);
                    if(v === undefined){
                        return '';
                    }
                    return v;
                case 'function':
                    return invoke(item);
                case 'filter':
                    return filter(item);
                default:
                    return item.src;
            }
        }

        /**
         * 获取字段值
         * @param datas 数据数组
         * @param fn    字段
         * @param alias 别名
         */
        function getValue(datas,fn,alias){
            for(var i=0;i<datas.length;i++){
                var model = datas[i];
                if(model === null || model === undefined){
                    continue;
                }
                //model不为对象，则直接返回
                if(typeof model !== 'object'){
                    return model;
                }
                //处理alias
                if(!DD.isEmpty(alias) && fn.indexOf(alias + '.') === 0){
                    fn = fn.substr(alias.length+1);
                }

                //为model才处理字段
                if(DD.isFunction(model.get)){
                    var v = model.get(fn);
                    if(v !== undefined){
                        return v;
                    }    
                }
            }
        }
    }
    
    DD.Expression = new M();
}());


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

/**
 * 过滤器
 * @author yanglei
 * @since 1.0
 */

(function(){
    var M = function(){
        var me = this;
        //不可修改的过滤器列表
        me.cantEditFilters = ['date','currency','number','tolowercase','touppercase','orderBy','filter'];
        //过滤器对象
        me.filters = {
            /**
             * 格式化日期
             * @param format    日期格式
             */
            date : function(value,param){
                if(DD.isEmpty(value)){
                    throw DD.Error.handle('invoke','filter date',0,'string');
                }
                if(!DD.isArray(param)){
                    throw DD.Error.handle('paramException',DD.words.filter,'date');
                }
                var format = param[0];
                //去掉首尾" '
                format = format.substr(1,format.length-2);
                return DD.formatDate(value,format);
            },
            /**
             * 转换为货币
             * @param sign  货币符号¥ $ 等，默认 ¥
             */
            currency : function(value,param){
                var sign;
                if(DD.isArray(param)){
                    sign = param[0];
                }
                if(isNaN(value)){
                    throw DD.Error.handle('paramException',DD.words.filter,'currency');
                }
                if(typeof value === 'string'){
                    value = parseFloat(value);
                }
                if(DD.isEmpty(sign)){
                    sign = '¥';
                }
                return sign + me.filters.number(value,[2]);
            },
            /**
             * 格式化，如果为字符串，转换成数字，保留小数点后位数
             * @param digits    小数点后位数
             */
            number : function(value,param){
                if(!DD.isArray(param)){
                    throw DD.Error.handle('paramException',DD.words.filter,'number');
                }
                var digits = param[0]||0;
                if(isNaN(value) || digits < 0){
                    throw DD.Error.handle('paramException',DD.words.filter,'number');
                }
                if(typeof value === 'string'){
                    value = parseFloat(value);
                }
                return value.toFixed(digits);
            },
            /**
             * 转换为小写字母
             */
            tolowercase : function(value){
                if(!DD.isString(value) || DD.isEmpty(value)){
                    throw DD.Error.handle('invoke1',DD.words.filter + ' tolowercase',0,'string');
                }
                return value.toLowerCase();
            },

            /**
             * 转换为大写字母
             * @param value
             */
            touppercase : function(value){
                if(!DD.isString(value) || DD.isEmpty(value)){
                    throw DD.Error.handle('invoke1',DD.words.filter + ' touppercase',0,'string');
                }
                return value.toUpperCase();
            },

            /**
             * 数组排序
             * @param arr       数组
             * @param param     
             *     用法: orderBy:字段:desc/asc
             */
            orderBy : function(arr,param){
                if(!DD.isArray(param)){
                    throw DD.Error.handle('invoke1',DD.words.filter + ' orderBy',0,'array');
                }
                var p = param[0];                  //字段
                var odr = param[1] || 'asc';    //升序或降序,默认升序
                //复制数组
                var ret = arr.concat([]);
                ret.sort(function(a,b){
                    if(odr === 'asc'){
                        return a[p] > b[p];    
                    }else{
                        return a[p] < b[p];
                    }
                });
                return ret;
            },
            /**
             * 数组过滤
             * 用法: 无参数filter:odd,带参数 filter:range:1:5
             * odd      奇数
             * even     偶数
             * v:       值中含有v字符的
             * {prop:v} 属性prop的值中含有v字符的
             * func     自定义函数过滤
             * range    数组范围
             * index    数组索引序列
             *
             * @param   array       待过滤数组
             * @param   paramStr    参数串 如 range:1:5，参数之间以“:”分隔
             */
            filter : function(array,pa){
                var me = this;
                if(!DD.isArray(array)){
                    throw DD.Error.handle('invoke1',DD.words.filter + ' filter',0,'array');
                }

                if(DD.isEmpty(pa)){
                    throw DD.Error.handle('invoke3',DD.words.filter + ' filter',0,'array');
                }
                //方法对象
                var handler = {
                    odd:function(arr){
                        var ret = [];
                        for(var i=0;i<arr.length;i++){
                            if(i%2 === 1){
                                ret.push(arr[i]);
                            }
                        }
                        return ret;
                    },
                    even:function(arr){
                        var ret = [];
                        for(var i=0;i<arr.length;i++){
                            if(i%2 === 0){
                                ret.push(arr[i]);
                            }
                        }
                        return ret;
                    },
                    range:function(arr,pa){
                        var ret = [];
                        //第一个索引,第二个索引
                        var first,last;
                        if(!isNaN(pa[0])){
                            first = parseInt(pa[0]);
                        }else{
                            throw DD.Error.handle('paramException',DD.words.filter , 'filter range');
                        }

                        if(!isNaN(pa[1])){
                            last = parseInt(pa[1]);
                        }else {
                            throw DD.Error.handle('paramException',DD.words.filter , 'filter range');
                        }
                        if(first > last){
                            throw DD.Error.handle('paramException',DD.words.filter , 'filter range');   
                        }
                        
                        return arr.slice(first,last+1);
                    },
                    index:function(arr,pa){
                        if(!DD.isArray(arr) || !DD.isArray(pa)){
                            throw DD.Error.handle('paramException',DD.words.filter,'filter index');
                        }
                        var ret = [];
                        var len = arr.length;
                        if(pa.length>0){
                            pa.forEach(function(k){
                                if(isNaN(k)){
                                    return;
                                }
                                parseInt(k);
                                if(k>=0 && k<len){
                                    ret.push(arr[k]);
                                }
                            });
                        }
                        return ret;
                    },
                    func:function(arr,param){
                        if(!DD.isArray(arr) || DD.isEmpty(param)){
                            throw DD.Error.handle('paramException',DD.words.filter,'filter func');   
                        }
                        
                        var foo = me.methodFactory.get(param[0]);
                        if(DD.isFunction(foo)){
                            return foo(arr);    
                        }
                        return arr;
                    },
                    value:function(arr,param){
                        if(!DD.isArray(array) || DD.isEmpty(param)){
                            throw DD.Error.handle('paramException',DD.words.filter,'filter value');   
                        }
                        var ret = [];
                        if(param[0] === '{' && param[param.length-1] === '}'){
                            param = eval('(' + param + ')');
                        }
                        //参数过滤
                        if(DD.isObject(param)){
                            var keys = DD.getOwnProps(param);
                            return arr.filter(function(item){
                                for(var i=0;i<keys.length;i++){
                                    var v =  item[keys[i]];
                                    var v1 = param[keys[i]];
                                    if(typeof v === 'string' && v.indexOf(v1) !== -1 || v === v1){
                                        return true;
                                    }
                                }
                                return false;
                            });
                        }else{
                            return arr.filter(function(item){
                                var props = DD.getOwnProps(item);
                                for(var i=0;i<props.length;i++){
                                    var v = item[props[i]];
                                    if(DD.isString(v) && v.indexOf(param) !== -1){
                                        return item;
                                    }
                                }
                            });
                        }
                    }
                }
                var type = pa[0].trim();
                //默认为value
                if(!handler.hasOwnProperty(type)){
                    type = 'value';
                }
                //校验输入参数是否为空
                if(type === 'range' || type === 'index' || type === 'func'){
                    if(pa.length < 2){
                        throw DD.Error.handle('paramException',Dd.words.filter);
                    }
                    //方法调用
                    return handler[type].call(me,array,pa.slice(1));
                }else if(type === 'value'){
                    return handler[type].call(me,array,pa[0]);
                }else{
                    return handler[type].call(me,array);
                }
            }
        }
    }

    /**
     * 过滤器处理
     * @param src       待处理源
     * @param param     过滤器参数串
     * @return          处理结果
     */
    M.prototype.handle = function(module,src,params){
        var me = this;
        if(DD.isEmpty(src)){
            return '';
        }
            
        if(DD.isEmpty(params)){
            return src;
        }
        /**
         * 1 处理所有的{}内容
         * 2 分多级过滤,下级过滤器使用上级过滤器结果
         * 3 单个过滤器处理
         */
        //1
        //定义替换串
        var replaceStr = '$DD_rparam_',                         //替代串
            reg = new RegExp(/(\{.+?\})|(".+?")|('.+?')/g),     //替代正则式
            replaceArr = [],                                    //替代数组
            r,
            i=0;

        while((r=reg.exec(params)) !== null){
            replaceArr.push(r[0]);
            params = params.replace(r[0], replaceStr + i++);
        }
        var farr = params.split('|');
        farr.forEach(function(param){
            if(DD.isEmpty(param.trim())){
                return;
            }
            var pa = param.split(':');
            var type = pa[0].trim();
            
            //{}格式对象还原
            if(replaceArr.length>0){
                for(var ii=1;ii<pa.length;ii++){
                    for(var i=0,len=replaceArr.length;i<len;i++){
                        pa[ii] = pa[ii].trim().replace(replaceStr+i,replaceArr[i]);
                    }    
                }
            }
            if(DD.isFunction(me.filters[type])){
                src = me.filters[type].call(module,src,pa.slice(1));
            }
        });
        return src;
    }

    /**
     * 添加过滤器
     * @param name  过滤器名
     * @param foo   过滤器方法
     */
    M.prototype.add = function(name,foo){
        var me = this;
        if(me.cantEditFilters.indexOf(name) !== -1){
            throw DD.error.handle('notupd',DD.words.system + DD.words.filter,name);
        }
        if(me.filters[name] !== undefined){
            throw DD.Error.handle('exist1',DD.words.filter,name);
        }
        me.filters[name] = foo;
    }

    /**
     * 移除过滤器
     * @param name  过滤器名
     */
    M.prototype.remove = function(name){
        var me = this;
        if(me.cantEditFilters.indexOf(name) !== -1){
            throw DD.Error.handle('notupd',DD.words.system + DD.words.filter,name);
        }
        if(me.filters[name] === undefined){
            throw DD.Error.handle('notexist1',DD.words.filter,name);
        }
        delete me.filters[name];
    }

    DD.Filter = new M();
}());

(function(){
	var M = function(){
		var me = this;
		me.methods = {};
	}

	M.prototype = {
		add:function(mname,handler){
			var me = this;
			if(DD.isEmpty(mname)){
				throw DD.Error.handle('invoke','DD.MethodFactory.add',0,'string');
			} 
			if(!DD.isFunction(handler)){
				throw DD.Error.handle('invoke','DD.MethodFactory.add',0,'function');
			}
			
			if(DD.isFunction(me.methods[mname])){
				throw DD.Error.handle('exist1',DD.words.method,mname);
			}
			me.methods[mname] = handler;
		},
		remove:function(mname){
			var me = this;
			if(DD.isEmpty(mname)){
				throw DD.Error.handle('invoke','DD.MethodFactory.remove',0,'string');
			}
			if(me.methods[mname] === undefined){
				throw DD.Error.handle('notexist1',DD.words.method,mname);
			}
			delete me.methods[mname];
		},
		get:function(mname){
			return this.methods[mname];
		}
	}

	DD.MethodFactory = M;
}());
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
        me.inited = false;
        me.compiled = false;
        me.onReceive = config.onReceive;
        me.fromModules = config.fromModules;
        me.onRender = config.onRender;
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

        return me;
    }

    /**
     * 初始化
     */
    Module.prototype.init = function(callback){
        var me = this;
        var config = me.initConfig;
        //初始化路由
        if(config.router !== undefined && config.router !== null){
            me.addRouter(config.router);
        }
        me.inited = true;

        loadRequireRes();

        /**
         * 加载reqiure资源
         */
        function loadRequireRes(){
            var loadCnt = 0;
            if(DD.isArray(config.requires) && config.requires.length>0){
                config.requires.forEach(function(item){
                    var type = 'js' || item.type;
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
                            loadCnt++;
                            // 加载
                            DD.http.load({
                                url:path,
                                type:type,
                                successFunc:function(){
                                    //加载module资源
                                    if(--loadCnt === 0){
                                        loadModuleRes();
                                    }
                                }
                            });
                    }
                });
                if(loadCnt === 0){
                    loadModuleRes();    
                }
            }else{
                loadModuleRes();
            }
        }
        /**
         * 加载data、template资源
         */
        function loadModuleRes(){
            //数据
            if(DD.isObject(config.data)){
                initData(config.data);
            }else if(!DD.isEmpty(config.dataUrl)){      //加载数据
                DD.http.load({
                    url:config.dataUrl,
                    type:'json',
                    successFunc:function(r){
                        initData(r);
                    }
                });
            }else{
                //空数据
                initData({});
            }

            //设置父module
            if(config.parent instanceof Module){
                me.parent = config.parent;
            }
            

            //创建virtualDom
            if(!me.virtualDom){
                me.virtualDom = DD.newEl('div');
                //子视图
                if(me.parent){
                    var view = DD.get(config.el,false,me.parent.virtualDom);
                    if(view  !== null){
                        //转移子节点到virtualDom
                        DD.transChildren(view,me.virtualDom);
                    }
                }else{ // 父试图
                    var view = DD.get(config.el,false,document.body);
                    if(view  !== null){
                        //转移子节点到virtualDom
                        DD.transChildren(view,me.virtualDom);
                        // 设定module 对应view
                        me.view = view; 
                        //扩展me.view    
                        DD.merge(me.view,DD.extendElementConfig);   
                        //清空
                        DD.empty(me.view);
                    }
                }

                // 处理模版串
                if(!DD.isEmpty(config.template)){                   //template string
                    composite(config.template);
                }else if(!DD.isEmpty(config.templateUrl)){         //template file
                    var path = config.templateUrl;
                    if(DD.config && !DD.isEmpty(DD.config.appPath)){
                        path = DD.config.appPath + '/' + path;
                    }
                    DD.http.load({
                        url:path,
                        successFunc:function(r){
                            composite(r);
                        }
                    });
                }else{
                    composite(null);
                }
            }
        }

        /**
         * 初始化数据
         * @param data 模型的数据
         */
        function initData(data){
            me.data = new DD.Model({data:data,module:me});
            DD.Renderer.add(me);    
        }

        /**
         * 组合virturlDom 的innerHTML
         * @param html 添加的html
         */
        function composite(html){
            //把html 添加到
            if(html !== null){
                DD.append(me.virtualDom,html);
            }

            me.compile();
            
            //子模块初始化
            if(DD.isArray(config.modules)){
                config.modules.forEach(function(mc){
                    me.addModule(mc);
                });
            }
            
            // 初始化回调
            if(DD.isFunction(callback)){
                callback(me);
            }
            //删除initConfig
            delete me.initConfig;
        }
    }
        
    /**
     * 编译模版或element
     */
    Module.prototype.compile = function(){
        var me = this;
        var cls;
        me.compiled=false;
        // class存在，则需要先检查class是否存在virtualDom，如果存在，则不用再编译，否则把模块的virturalDom编译了给class
        if(me.className && (cls = DD.Module.getClass(me.className))!==undefined && cls.virtualDom !== null){
            me.virtualDom = cls.virtualDom;
            return;
        }
        //编译
        var vd = compileEl(me.virtualDom);
        if(cls !== undefined){
            cls.virtualDom = vd;
        }
        me.compiled = true;
        
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
            DD.getAttrsByValue(el,/\{\{\S+?\}\}/).forEach(function(attr){
                // 保存带表达式的属性
                el.$attrs[attr.name]=DD.Expression.initExpr(attr.value,el);
            });

            //初始化指令集
            DD.Directive.initViewDirectives(el);
            //遍历childNodes进行指令、表达式、路由的处理
            var nodes = el.childNodes;
            for(var i=0;i<nodes.length;i++){
                var node = nodes[i];
                switch(node.nodeType){
                    case Node.TEXT_NODE:        // 文本
                        // 处理文本表达式
                        if(/\{\{.+\}\}?/.test(node.textContent)){
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
        
        //无数据 或 view没有compile
        if(!me.data || !me.compiled){
            return false;
        }

        // me.view不存在，需要查找
        if(!DD.isEl(me.view)){
            getView(me);
        }

        //找不到view，返回
        if(!DD.isEl(me.view)){
            return false;
        }
        if(me.view.childNodes.length === 0){ //没渲染过，从virtualDom渲染
            //用克隆节点操作，不影响源节点
            var cloneNode = DD.cloneNode(me.virtualDom);
            //把cloneNode下的所有节点渲染到view
            renderDom(cloneNode,true);
            //把clone后的子节点复制到模块的view
            DD.transChildren(cloneNode,me.view);
            //触发首次渲染事件
            if(!me.rendered && DD.isFunction(me.onRender)){
                me.onRender();
            }
            //设置已渲染标志
            me.rendered = true;
        }else{  //渲染过，从view渲染
            renderDom(me.view,true);
        }
        
        //渲染成功
        return true;
        
        /**
         * 渲染virtual dom
         * @param node      待渲染节点
         * @param isRoot    是否是根节点
         */
        function renderDom(node,isRoot){
            if(node.$isView){
                var model = node.$getData();
                var alias = node.$model.aliasName;
                //设置routerview,不是root的才处理
                if(node.$isRouter && !isRoot && me.router){
                    me.router.renderView = node;
                }
                //未渲染，则进行事件初始化
                if(!node.$rendered && DD.isEl(node)){
                    initEvents(node);
                }

                //处理属性
                if(DD.isEl(node)){
                    var directives = [];
                    DD.getOwnProps(node.$attrs).forEach(function(attr){
                        if(typeof(node.$attrs[attr]) === 'function'){
                            return;
                        }
                        var v = DD.Expression.handle(node,node.$attrs[attr],[model,me.data],alias);
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
                //渲染子节点
                if(node.childNodes){
                    for(var i=0;i<node.childNodes.length;i++){
                        renderDom(node.childNodes[i]);
                    }
                }
                //设置渲染标志
                node.$rendered = true;
            }else if(node.nodeType === Node.TEXT_NODE && node.$exprs !== undefined){
                var c = DD.Expression.handle(me,node.$exprs,[node.parentNode.$getData(),me.data],node.parentNode.$model.aliasName); 
                //清除之前加载的节点
                var bn = node.nextSibling;
                for(;bn!==null && bn.$fromNode === node;){
                    var n = bn.nextSibling;
                    DD.remove(bn);
                    bn = n;
                }
                //表达式处理后得到结果
                //如果存在element，则直接添加到node后面，否则修改node的textContent
                var div = document.createElement('div');
                div.innerHTML = c;
                var frag = document.createDocumentFragment();
                var hasEl = false;
                for(var i=0;i<div.childNodes.length;){
                    var n = div.childNodes[i];
                    if(DD.isEl(n)){
                        hasEl = true;
                    }
                    n.$fromNode = node;
                    frag.append(div.childNodes[i]);
                }
                if(!hasEl){
                    node.textContent = c;
                }else{
                    DD.insertAfter(frag,node);
                }
            }
            return node;
        }

        /**
         * 获取view
         */
        function getView(module){
            if(!module.view){
                if(module.parent){
                    // 父view不存在，级联上找
                    if(!module.parent.view){
                        getView(module.parent);
                    }
                    if(module.parent.view !== undefined){
                        module.view = DD.get(me.el,false,module.parent.view);
                    }
                    // 清空模块view
                    if(module.view){
                        DD.empty(module.view);
                    }
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

        if(me.getModule(config.name) !== null){
            throw DD.Error.handle('exitst1',DD.words.module,config.name);   
        }
        config.parent = me;
        var m = DD.Module.newInstance(config);
        me.modules.push(m);
        return m;
    }
    /**
     * 添加路由
     */
    Module.prototype.addRouter = function(config){
        var me = this;
        var router;
        if(config instanceof DD.Router){
            config.module = me;
            router = config;
        }else if(DD.isObject(config)){
            config.module = me;
            router = new DD.Router(config); 
        }
        me.router = router;
        return router;
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
        if(me.view){
            DD.empty(me.view);
        }
        new DD.Model({data:data,module:me});
        DD.Renderer.add(me);
    }

    /**
     * 查找子module
     * @param moduleName   模块名
     * @return  module 或 null
     */
    Module.prototype.getModule = function(moduleName){
        if(DD.isEmpty(moduleName)){
            throw DD.Error.handle('invoke1','getModule',0,'string');
        }
        for(var i=0;i<this.modules.length;i++){
            if(this.modules[i].name === moduleName){
                return this.modules[i];
            }
        }
        return null;
    }

    
    /**
     * 广播，向兄弟模块广播
     * @param data    广播的数据
     */
    Module.prototype.broadcast = function(data){
        var me = this;
        if(!me.parent){
            return;
        }
        var mname = me.name;
        me.parent.modules.forEach(function(m){
            if(m === me){
                return;
            }
            if(DD.isFunction(m.onReceive)){
                var call = true;
                //如果fromModules 是数组且不为空，则要判断是否要接收该module发送来的消息
                if(DD.isArray(m.fromModules) && m.fromModules.length !== 0){
                    if(m.fromMudules.indexOf(mname) === -1){
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
            if(me.classFactory[cname] !== undefined){
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
            var mname = config.name;
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
            return DD.Module.newInstance(config);
        },
        defineModule:function(config){
            return DD.Module.define(config);
        }
    });
    

    DD.Module = Module;
}());

/**
 * 路由，主要用于模块间跳转，一个应用中存在一个router，多个route，route节点采用双向链表存储
 * @author 		yanglei
 * @since 		1.0.0
 * @date		2017-01-21
 * @description	采用修改页面hash方式进行路由历史控制，每个route 可设置onEnter事件(钩子) 和 onLeave事件(钩子)
 */

(function(){
	/**
	 * Router 类
	 */
	var Router = function(config){
		var me = this;
		me.routes = [];					//存放路由
		me.history = [];				//历史 //修改hash中的module  www.abc.com/module1   www.abc.com/module2
		me.views = [];					// 保存路径和view
		me.root = config.root || '';	//根路径
		me.currentView = null;			//当前触发路由的view
		me.renderView = null;			//子路由渲染容器
		me.module = config.module;		//模块
		me.name = 'DDRouter_' + DD.genId();
		//初始化route列表
		if(DD.isArray(config.routes)){
			config.routes.forEach(function(r){
				me.add(r);
			});
		}

		//处理popstate事件
		window.addEventListener('popstate' , function(e){
			//清空routerView
			DD.empty(me.renderView);

			//删除当前view的activeClass
			if(me.currentView && me.currentView.$routeConfig['activeclass'] !== undefined){
				DD.removeClass(me.currentView,me.currentView.$routeConfig['activeclass']);
			}
			//根据state切换module
			var state = history.state;
			if(state !== null){
				me.start(state.path,me.views[state.path],false);
			}
		});

	}

	/**
	 * 初始化router view
	 */
	Router.initView = function(view){
		if(!view.$module.router){
			return;
		}
		//设置routerview
		view.$module.router.renderView = view;
		//设置routerview 标志
		view.$isRouter = true;
		//清空
		DD.empty(view);

	}

	/**
	 * 路由器处理
	 */

	Router.prototype = {
		/**
		 * 启动指定路径的路由
		 * @param path 	路径
		 * @param view  route element
		 * @param pushFlag 是否pushFlag
		 */
		start:function(path,view,pushFlag){
			var me = this;

			//连续两次同一个路径不进行操作
			if(me.currentPath === path){
				return;
			}
			me.currentPath = path;
			
			var route = me.get(path);
			if(route === undefined){
				throw DD.Error.handle('notexist1',DD.words.route,path);
			}
			//更改样式
			if(DD.isEl(view) && view.$routeConfig['activeclass'] !== undefined){
				var cls = view.$routeConfig['activeclass'];
				// 删除currentView的activeClass
				if(me.currentView){
					DD.removeClass(me.currentView,cls);
				}
				DD.addClass(view,cls);
			}
			route.start(path,pushFlag);
			//保存当前点击view
			me.currentView = view;
			me.views[path] = view;
		},
		/**
		 * 添加路由
		 * @param config 	路由参数，参考Route定义
		 * @return 			新添加的route
		 */
		add:function(config){
			var me = this;
			config.router = me;
			var route = config;
			if(!(config instanceof Route)){
				route = DD.createRoute(config);
			}
			me.routes.push(route);
			return route;
		},

		/**
		 * 获取路由
		 * @parma path 	路径
		 * @return 返回找到的路由
		 */
		get:function(path){
			var me = this;
			for(var i=0;i<me.routes.length;i++){
				var route = me.routes[i];
				if(route.match(path)){
					return route;
				}
				// 递归查找
				if(DD.isArray(route.routes) && route.routes.length > 0){
					return me.get.call(route,path);
				}
			}
		}
	}

	

	/**
	 * Route 类
	 * @param config	路由参数对象
	 *			module: 模块名,
	 *			path: 	模块路径，可为空，用系统设置的模块根目录，如果不为空，则由模块根目录+设置的目录构成
	 *			routes: 子路由集合   
	 */
	var Route = function(config){
		var me = this;

		if(DD.isEmpty(config) || !DD.isObject(config)){
			throw DD.Error.handle('invoke','route',0,'object');
		}
		if(DD.isEmpty(config.module) && !config.module instanceof DD.module){
			throw DD.Error.handle('invoke2','route','module',DD.words.module,'string');	
		}
		//复制属性
		DD.assign(me,config);

		//处理module
		if(DD.isString(config.module)){  	//字符串为module名，从moduleFactory获取
			me.module = DD.Module.get(config.module);
			if(me.module === undefined){
				throw DD.Error.handle('notexist1',DD.words.module,config.module);	
			}	
		}else if(config.module instanceof DD.Module){								//参数为模块对象
			me.module = config.module;
		}
		//设置router
		me.routes = [];		//存放子路由
		me.type = 'string';	//路由类型
		var ind;
		//匹配/:  带参数的路径
		if((ind=me.path.indexOf('/:')) !== -1){
			me.type = 'param';
			var arr = me.path.split('/:');
			// 保存route基础路径
			me.path = arr[0] + '/';
			// 保存参数名数组
			me.paramNames = arr.slice(1);
		}
		if(config.routes && config.routes.length>0){
			//把路由添加到模块
			me.module.addRouter({
				routes:config.routes
			});
		}
		
	}

	/**
	 * 初始化route view
	 */
	Route.initView = function(view){
		//带保存属性
		var attrs = ['path','activeclass','active'];
		view.$isRoute = true;
		var active = false;
		//保存route参数
		for(var i=view.attributes.length-1;i>=0;i--){
			var attr = view.attributes[i];
			var an = attr.name.toLowerCase();
			if(attrs.indexOf(an) !== -1){
				view.$routeConfig[an] = attr.value;
				// 保存后删除路由相关属性
				view.removeAttribute(attr.name);
			}
			if(an === 'active'){
				view.$routeConfig['active'] = true;
			}
		}
		var path = view.$routeConfig['path'];
		if(view.tagName.toLowerCase() === 'a'){
			DD.attr(view,'href',path);
		}
		//绑定click事件
		new DD.Event({
			view:view,
			eventName:'click',
			handler:function(v,e){
	        	//阻止href跳转
	        	e.preventDefault();
	        	// 启动路由
	        	if(v.$module.router instanceof Router){
	        		v.$module.router.start(path,v,true);
	        	}
	        }
		});
	}

	/**
	 * 路由启动
	 * @param path 		路径
	 * @param pushFlag 	pushstate标志
	 */
	Route.prototype.start = function(path,pushFlag){
		var me = this;
		var router = me.router;
		// 重定向处理
    	if(!DD.isEmpty(me.redirect)){
    		var route = router.get(me.redirect);
    		if(route === undefined){
    			throw DD.error.handle('未找到匹配的路由' + me.redirect);
    		}
    		route.start(route.path);
    		return;
    	}
    	// 调用onLeave钩子
		if(router.current !== undefined){
			if(DD.isFunction(router.current.onLeave)){
				router.current.onLeave.call(router.current.module);
			}
		}

		//设置当前路由
		router.current = me;
		var params = {};
		// 处理路由参数
		if(me.type === 'param'){
			// 清空参数对象
			var pstr = path.substr(me.path.length);
			pstr.split('/').forEach(function(item,i){
				// 添加参数
				var v = item.trim();
				if(v !== ''){
					params[me.paramNames[i]] = v;
				}
			});
		}
		//加入数据集
		if(!me.module.inited){
			me.module.init(function(){
				me.module.data.set('$route',{path:path,data:params});
				doRender();
			});
		}else{
			me.module.data.set('$route',{path:path,data:params});
			doRender();
		}
		
		//popstate出发的start不进行push
		if(pushFlag){
			// pushstate
			history.pushState({module:router.module.name,path:path},'',router.root + path);
		}

		//执行渲染
		function doRender(){//渲染模块到router view中
			me.module.view = router.renderView;
			//先清空router容器
			DD.empty(me.module.view);
			// 添加到渲染列表;
			DD.Renderer.add(me.module);
			//调用onEnter钩子
			if(DD.isFunction(me.onEnter)){
				me.onEnter.call(me.module);
			}
		}
		
	}
	
	Route.prototype.match = function(path){
		var me = this;
		if(path.indexOf(me.path) === 0){
			return true;
		}
		return false;
	}
	/**
	 * 添加子路由
	 * @param config 路由参数对象，参考Route
	 */
	Route.prototype.add = function(config){
		var me = this;
		config.router = me;
		var route = config;
		if(!config instanceof Route){
			route = new Route(config);
		}
		me.routes.push(route);
		return route;
	}


	DD.Router = Router;
	DD.Route = Route;
	DD.createRoute = function(config){
		return new DD.Route(config);	
	}
}());
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
		me.waitList = []; 		//待渲染列表
		me.rendering = false;	//正在渲染标志
	}
	Renderer.prototype = {
		/**
		 * 添加到渲染列表
		 */
		add:function(module){
			var me = this;
			var ind;
			//如果已经在列表中，不再添加
			if((ind = me.waitList.indexOf(module)) !== -1){
				return;
			}
			//计算优先级
			if(module.prop === undefined){
				var prop = 1,pm=module.parent;
				while(pm !== undefined){
					prop++;
					pm=pm.parent;
				}
			}
			module.prop=prop;
			me.waitList.push(module);
			//排序
			me.waitList.sort(function(a,b){
				return a.prop - b.prop;
			});
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
			me.waitList.forEach(function(m,i){
				//如果渲染成功，则从渲染队列删除
				if(m.render()){
					me.waitList.splice(i,1);
				}
			});
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

/*
 * 消息js文件 中文文件
 * @author yanglei
 * @since  v1.0
 * @date   2017-2-25
 */
DD.words = {
	system:"系统",
	module:"模块",
	moduleClass:'模块类',
	model:"模型",
	directive:"指令",
	expression:"表达式",
	event:"事件",
	method:"方法",
	filter:"过滤器",
	data:"数据",
	dataItem:'数据项',
	route:'路由'
}
/*异常消息*/
DD.ErrorMsgs = {
	"unknown":"未知错误",
	"paramException":"{0} {1}方法参数错误，请参考api",
	"invoke":"{0}方法调用参数{1}必须为{2}",
	"invoke1":"{0}方法调用参数{1}必须为{2}或{3}",
	"invoke2":"{0}方法调用参数{1}或{2}必须为{3}",
	"invoke3":"{0}方法调用参数{1}不能为空",
	"exist":"{0}已存在",
	"exist1":"{0} {1}已存在",
	"notexist":"{0}不存在",
	"notexist1":"{0} {1}不存在",
	'notupd':'{0}不可修改',
	'notremove':'{0}不可删除',
	'notremove1':'{0}{1}不可删除'
}

/*form消息*/
DD.FormMsgs = {
	"type":"请输入有效的{0}",
	"unknown":"输入错误",
	"required":"不能为空",
	"minLength":"输入长度最小为{0}",
	"maxLength":"输入长度最大为{0}",
	"betweenLength":"输入长度必须在{0}-{1}之间",
	"min":"数字最小为{0}",
	"max":"数字最大为{0}",
	"between":"数字必需在{0}-{1}之间",
}