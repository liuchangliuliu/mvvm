function Vue(options) {
    this.$options = options;
    let data = this._data = this.$options.data;
    // 观察数据data
    observe(data);

    // this 代理this._data
    Object.keys(data).forEach(key =>{
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key];
            },
            set(value) {
                this._data[key] = value;
            }
        })
    })
    initComputed.call(this);
    // 编译模板
    new Compile(options.el, this);
}

// 初始化计算属性
function initComputed() {
    debugger
    let vm = this;
    let computed = this.$options.computed;
    for(k in computed) {
        Object.defineProperty(vm, k, {
            enumerable: true,
             //  判断计算属性是个函数还是一个对象 hello() {} or hello: {get(){}, set() {}}
            get: typeof computed[k] === 'function' ? computed[k] : computed[k].get,
            set() {

            } 
        })
    }
}

//观察对象 给对象添加defineProperty
function observe(data) {
    for(let key in data) {
        let val = data[key];
        let dep = new Dep();
        //如果data的属性值还是对象，则递归做劫持
        if (data !== null &&typeof val=== 'object') {
          observe(val);
        }
        // 使用defineProperty的方式定义属性
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                // 当target不为空时，则当前data为target的依赖， 所以将其添加到订阅列表中
                if (Dep.target) {
                    dep.addSub(Dep.target);
                }
                return val;
            },
            set(newVal) {
                // 如果旧值不等于新值 则赋值
                if(val === newVal) {
                    return ;
                }
                // 在get数据的时候可以将新值返回
                val = newVal;
                // 如果新值为一个对象，则需要继续对属性做劫持
                if(val !== null && typeof val === 'object') {
                    observe(val);
                }
                // 数据发生变化时，通知订阅者更新
                dep.notify();
            }
        })
    }

}

function Compile(el, vm) {
    // 获取vue实例的根元素
    vm.$el = document.querySelector(el);
    let fragment = document.createDocumentFragment();
    // 将dom节点移动到内存中
    while(child = vm.$el.firstChild) {
        fragment.appendChild(child);
    }
    function replace(fragment) {
        // fragement是一个类似数组结构
        Array.from(fragment.childNodes).forEach(node =>{
            // 获取节点的文本内容
            let content = node.textContent;
            // {{}}的正则
            let reg = /\{\{(.*)\}\}/;
            
            //如果node是文本节点且有需要编译的{{}}
            if(node.nodeType === 3 && reg.test(content)) {
                // 获取匹配正则表达式中的第一个匹配 （a.b) 并将其分割成字符数组[a,b]
                let arr = RegExp.$1.split('.');
                var val = vm;
                // 获取vue.a.b的值
                arr.forEach(key =>{
                    // 会劫持vue._data中的get方法来获取返回的数据
                    val = val[key];
                })
                // 添加watcher 当data中依赖的数据改变时，通过watcher的update方法更新到页面中去
                new Watcher(vm, RegExp.$1, function(newVal){
                    node.textContent = content.replace(/\{\{(.*)\}\}/, newVal);
                })
                // 把获取的数据替换掉模板
                node.textContent = content.replace(/\{\{(.*)\}\}/, val);
            }

            //如果是元素节点
            if(node.nodeType === 1) {
                // 获取元素的所有属性
                let attrs = node.attributes;
                Array.from(attrs).forEach(attr =>{
                      //attr = 'v-model= "b" '
                      let name = attr.name; //name = v-model
                      let exp = attr.value  //exp = b;
                    // 如果属性以v-开头
                    if (name.indexOf('v-') === 0) {
                        let val = vm;
                        exp.split('.').forEach(key =>{
                            val = val[key];
                        })
                        node.value = val;
                        // 订阅数据更新事件
                        new Watcher(vm, exp, function (newVal) {
                            node.value = newVal;
                        })
                        // 输入框变化时， 将值赋予到vm上
                        node.addEventListener('input', function (e) {
                            let newVal = e.target.value; //获取新值
                            // 触发observe的set
                            expr = exp.split('.');
                            expr.reduce((prev, next, index) => {
                                if(index === expr.length -1) {
                                    prev[next] = newVal;
                                } else {
                                    return prev[next];
                                }
                            }, vm)
                        })
                    }
                })
            }
            // 如果当前结点还有子节点 则递归编译
            if(node.childNodes) {
                replace(node);
            }
        })
    }
    //编译vue实例的根节点
    replace(fragment);
    // 将在内存中的节点重新入到dom中
    vm.$el.appendChild(fragment);
}

// 观察者
function Watcher(vm, exp, fn) {
    // 当前对象
    this.vm = vm;
    // 正则
    this.exp = exp;
    //回掉函数
    this.fn = fn;
    //将当前实例绑定到Dep构造的属性上
    Dep.target = this;
    // 获取引用对应的值
    let arr = this.exp.split('.');
    let val = vm;
    arr.forEach(key => {
        // 获取data数据的时候 因为target不为空，所以会将当前实例放入val的订阅列表中
        val = val[key];
    })
    // 循环完依赖 将target置空，以免将当前实例添加在非依赖的订阅列表中
    Dep.target = null;
}
Watcher.prototype.update = function() {
    // 获取data中的值
    let val = this.vm;
    let arr = this.exp.split('.');

    arr.forEach(key =>{
        val = val[key];
    })
    // 执行watcher的update方法，使更新的值渲染到文档中
    this.fn(val);
    
}

//发布订阅
function Dep() {
    // subs中存储订阅实例
    this.subs = [];
}
// 添加订阅，给依赖当前数据的实例的watcher添加到订阅列表中
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
}
// 发布信息函数
Dep.prototype.notify = function() {
    // 依次执行订阅者的update方法使得订阅者也更新
    this.subs.forEach(item => {
        item.update();
    })
}