// 发布订阅模式   先订阅
// 绑定的方法都需要有一个update属性
function Dep() {
    this.subs = [];
}
// 添加订阅
Dep.prototype.addSub = function(sub) {
    this.subs.push(sub);
}
Dep.prototype.notify = function() {
    this.subs.forEach(sub =>{
        sub.update();
    }) 
}
// Watcher类的实例都会有update方法
function Watcher(fn) {
    this.fn = fn;
}
Watcher.prototype.update = function () {

    this.fn();
}
let watcher = new Watcher(function() {
    // 监听函数的内容
    console.log(1);
})
let dep = new Dep();
dep.addSub(watcher); //将订阅者放入subs[]中
console.log(dep.subs);

dep.notify(); //发布：将subs订阅的函数依次执行