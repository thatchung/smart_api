const Config = require('../config');
const BaseModel = require('../core/base-model');
const fs = require('fs');
const path = require('path');

const moduleExport = {};

let files = fs.readdirSync(path.dirname(module.filename));
let associations = [];
for (let file of files) {
    if (file === path.basename(module.filename))
        continue;

    let model = require(path.join(path.dirname(module.filename), file));
    moduleExport[model.tableName] = model;

    if (model._associations)
        associations.push(model._associations.bind(model));
}

for (let association of associations)
    association(moduleExport);

module.exports = moduleExport;