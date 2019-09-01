function Test(options = {}) {
    // 将所有的属性挂载在$options
    this.$options = options;
    var data = this._data = this.$options.data
    // 数据劫持 defineProperty
    observer(data);
    //this代理this._data
    for (let key in data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key];
            },
            set(newVal) {
                // 调用observe的set

                this._data[key] = newVal;
            }
        })
    }
    initComputed.call(this)
    // 编译模板
    new Compile(options.el, this);

}
function initComputed() {
    let vm = this;
    let computed = this.$options.computed;
    Object.keys(computed).forEach(function (k) {
        Object.defineProperty(vm, k, {
            //  判断计算属性是个函数还是一个对象 hello() {} or hello: {get(){}, set() {}}

            get: typeof computed[k] === 'function' ? computed[k] : computed[k].get,
            set() {

            }
        })
    })
}

// 观察对象，给对象添加Object.defineProperty ,做数据劫持
// function Observe(data) {
//     //{b:1}
//     for (let key in data) {
//         let dep = new Dep();
//         let val = data[key];
//         observe(val);
//         Object.defineProperty(data, key, {
//             enumerable: true,
//             get() {
//                 Dep.target && dep.addSub(Dep.target);
//                 return val;
//             },
//             set(newVal) {
//                 // 如果设置的值没有变化
//                 if (newVal === val) {
//                     return;
//                 }
//                 // 赋值给val,因为get取值是取的val，
//                 val = newVal;
//                 observe(newVal)
//                 dep.notify(); //执行所有watcher的update
//             }
//         })
//     }
// }

// function observe(data) {
//     if (typeof data !== 'object') return;
//     return new Observe(data)
// }

// 编译模板
function Compile(el, vm) {
    vm.$el = document.querySelector(el);
    let fragment = document.createDocumentFragment();
    // 将#app中的内容移入内存中
    while (child = vm.$el.firstChild) {
        fragment.append(child);
    }
    replace(fragment)
    function replace(fragment) {
        Array.from(fragment.childNodes).forEach(function (node) {
            let content = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            // 是文本元素
            if (node.nodeType === 3 & reg.test(content)) {
                let arr = RegExp.$1.split('.') //属性 [a,b]
                let val = vm;
                arr.forEach(function (key) {
                    val = val[key];
                })
                // 订阅数据变化的事件
                new Watcher(vm, RegExp.$1, function (newVal) {
                    // 函数需要接收新值
                    node.textContent = content.replace(/\{\{(.*)\}\}/, newVal);
                })
                node.textContent = content.replace(/\{\{(.*)\}\}/, val);
            }
            // 如果是元素节点
            if (node.nodeType === 1) {
                let attrs = node.attributes;
                Array.from(attrs).forEach(attr => {
                    //attr = 'v-model= "b" '
                    let name = attr.name; //name = v-model
                    let exp = attr.value  //exp = b;
                    if (name.indexOf('v-') === 0) {
                        // 如果name是以v-开头
                        node.value = vm[exp];
                        // 订阅数据更新事件
                        new Watcher(vm, exp, function (newVal) {
                            node.value = newVal;
                        })
                        // 输入框变化时， 将值赋予到vm上
                        node.addEventListener('input', function (e) {
                            let newVal = e.target.value; //获取新值
                            vm[exp] = newVal;

                        })
                    }
                })
            }
            // 递归编译
            if (node.childNodes) {
                replace(node);
            }
        })
    }

    vm.$el.appendChild(fragment);
}


//发布订阅
function Dep() {
    this.subs = [];
}
Dep.prototype.addSub = function (sub) {
    this.subs.push(sub);
}
Dep.prototype.notify = function () {
    this.subs.forEach(sub => {
        sub.update();
    })
}

//订阅
function Watcher(vm, exp, fn) {
    this.vm = vm;
    this.exp = exp;
    this.fn = fn;
    // 添加到订阅中
    Dep.target = this;
    // 取值
    let val = vm;
    let arr = exp.split('.');
    arr.forEach(key => {
        val = val[key];
    })
    Dep.target = null;
}
Watcher.prototype.update = function () {
    // 取值
    let val = this.vm;
    let arr = this.exp.split('.');
    arr.forEach(key => {
        val = val[key];
    })
    this.fn(val);
}



function observer(data) {
    for (let key in data) {
        let val = data[key];
        // 如果val不是基本数据类型，则需要继续劫持
        if (val != null && typeof val === "object") {
            observer(val);
        }
        let dep = new Dep();
        Object.defineProperty(data, key, {
            enumerable: true,
            get() {
                Dep.target && dep.addSub(Dep.target);
                return val;
            },
            set(newval) {
                // 如果数据发生变化
                if (newval === val) {
                    return;
                }
                val = newval;
                // 新值如果不是基本数据类型，则需要继续
                if (val != null && typeof val === "object") {
                    observer(val);
                }
                dep.notify(); 
            }
        })
    }
}
//vue不能新增不存在的属性，因为新增的属性没有set和get
// 深度响应 因为每次赋值都会给新对象增加数据劫持
