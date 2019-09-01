function Vue(options) {
    debugger
    this.$options = options;
    let data = this._data = this.$options.data;

    observe(data);
}

function observe(data) {
    if (typeof data !== 'object') {
        return ;
    }

    Object.keys(data).forEach(function(key) {

    })
}