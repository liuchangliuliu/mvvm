self.addEventListener('message', function(e) {
    this.postMessage('main line said:' + e.data);

}, false)