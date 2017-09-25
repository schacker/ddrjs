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
     * @param module    模块
     * @param exprArr   表达式数组
     * @param model     model.$model
     * @return          处理结果
     */
    M.prototype.handle = function(module,exprArr,model){
        var me = this;
        var result = '';
                
        if(!DD.isArray(exprArr)){
            return;
        }
        exprArr.forEach(function(item){
            if(item.type === 'string'){
                result += item.src;
            }else{
                result += me.cacExpr(module,item.src,model);
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
            //更改下一个表达式的对比起点
            ind = r.index + r[0].length;
        }
        //最后一个字符串
        if(ind < exprStr.length-1){
            result.push({
                type:'string',
                src:exprStr.substr(ind)
            });
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
                    type:'blank',       //空串
                    src:item            //源
                });
            }else if(!isNaN(item)){
                stack1.push({
                    type:'number',      //数字
                    src:eval(item)      //源
                });
            }else{
                if(item === "true" || item === "false"){
                    stack1.push({   
                        type:'bool',
                        src:eval(item)
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
                //按照优先级倒序查找操作符
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
                    var theCnt = 0;  //括号数量
                    if(sign === ')'){
                        theCnt++;
                        //替换括号前的空串并删除计算源i
                        pa.exprs[0] = stacks[0][i-1]; 
                        stacks[0].splice(i);
                        for(var j=i-2;j>=0;j--){
                            if(stacks[1][j] === ')'){
                                theCnt++;
                            }else if(stacks[1][j] === '('){
                                if(--theCnt===0){
                                    backIndex = j;
                                    break;    
                                }
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
    M.prototype.cacExpr=function(module,stacks,model){
        var expr = "";
        //是否存在运算符
        var hasCac = false;
        for(var i=0;i<stacks[1].length;i++){
            if(stacks[1][i] !== ''){
                hasCac=true;
                break;
            }
        }
        stacks[0].forEach(function(item,ii){
            var v = cacOne(item);
            var sign = ''; 
            
            //添加运算符
            if(ii<stacks[1].length){
                sign = stacks[1][ii];    
            }
            expr += v + sign;
        });
            
        //带有运算符，需要进行计算
        if(hasCac){
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
                        var v = getValue(module,p.src,model);
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
                    var v = getValue(module,item.src,model);
                    return addQuot(v);
                case 'function':
                    return addQuot(invoke(item));
                case 'filter':
                    return filter(item);
                default:
                    return item.src;
            }

            //添加引号
            function addQuot(v){
                if(!hasCac){
                    return v;
                }
                //如果是字符串，同时需要进行运算,需要给字符串加上 引号
                if(DD.isString(v)){
                    var ind = v.indexOf("'");
                    if(ind !== -1){
                        if(ind > 0){
                            v = '"' + v + '"';    
                        }
                    }else if((ind=v.indexOf('"')) > 0 || ind === -1){
                        v = "'" + v + "'";
                    }
                }
                return(v);
            }
        }

        /**
         * 获取字段值
         * @param datas 数据数组
         * @param fn    字段
         * @param model view.$model
         */
        function getValue(module,fn,model){
            var datas = [model.data,module.data];
            var alias = model.aliasName;
            for(var i=0;i<datas.length;i++){
                var m = datas[i];
                if(m === null || m === undefined){
                    continue;
                }
                //model不为对象，则直接返回
                //fn == alias
                if(fn === alias){
                    return m;
                }
                //fn == alias
                if(fn === model.indexName){
                    return model.index;
                }
                
                //处理alias
                if(!DD.isEmpty(alias) && fn.indexOf(alias + '.') === 0){
                    fn = fn.substr(alias.length+1);
                }
                if(fn === model.indexName){
                    return model.index;
                }
                //为model才处理字段
                if(DD.isFunction(m.$get)){
                    var v = m.$get(fn);
                    if(v !== undefined){    //如果没找到，则返回''
                        return v;
                    }
                }
            }
            return '';
        }
    }
    
    DD.Expression = new M();
}());

