const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return callback(null);
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        next();
                    });
                } else {
                    if (file.match(/\.(js|jsx|ts|tsx)$/)) {
                        processFile(file);
                    }
                    next();
                }
            });
        })();
    });
}

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: error.message || 'Lỗi không xác định' -> 'Lỗi không xác định'
    content = content.replace(/error\.message\s*\|\|\s*('[^']+'|"[^"]+")/g, '$1');
    content = content.replace(/err\.message\s*\|\|\s*('[^']+'|"[^"]+")/g, '$1');

    // Pattern 2: || err.message || "Có lỗi..." -> || "Có lỗi..."
    content = content.replace(/\|\|\s*err\.message\s*\|\|\s*('[^']+'|"[^"]+")/g, '|| $1');
    content = content.replace(/\|\|\s*error\.message\s*\|\|\s*('[^']+'|"[^"]+")/g, '|| $1');

    // Pattern 3: || err.message -> || 'Có lỗi xảy ra'
    content = content.replace(/\|\|\s*err\.message/g, "|| 'Có lỗi xảy ra'");
    content = content.replace(/\|\|\s*error\.message/g, "|| 'Có lỗi xảy ra'");

    // Pattern 4: + error.message -> + 'Có lỗi xảy ra'
    content = content.replace(/\+\s*error\.message/g, "+ 'Có lỗi xảy ra'");
    content = content.replace(/\+\s*err\.message/g, "+ 'Có lỗi xảy ra'");

    // Pattern 5: message = err.message; -> message = 'Có lỗi xảy ra';
    content = content.replace(/message\s*=\s*err\.message;/g, "message = 'Có lỗi xảy ra';");
    content = content.replace(/message\s*=\s*error\.message;/g, "message = 'Có lỗi xảy ra';");

    // Pattern 6: setError(err.message) -> setError('Có lỗi xảy ra')
    content = content.replace(/setError\(err\.message\)/g, "setError('Có lỗi xảy ra')");
    content = content.replace(/setError\(error\.message\)/g, "setError('Có lỗi xảy ra')");
    
    // Pattern 7: message.error(error.message) -> message.error('Có lỗi xảy ra')
    content = content.replace(/message\.error\(error\.message\)/g, "message.error('Có lỗi xảy ra')");
    content = content.replace(/message\.error\(err\.message\)/g, "message.error('Có lỗi xảy ra')");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
}

walk(path.join(__dirname, 'src'), function(err) {
    if (err) throw err;
    console.log('Done');
});
