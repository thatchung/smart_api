const fs = require('fs');
const path = require('path');

let files = fs.readdirSync(path.dirname(module.filename));
for (let file of files) {
    if (file === path.basename(module.filename))
        continue;

    require(path.join(path.dirname(module.filename), file));
}