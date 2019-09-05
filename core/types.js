const moment = require('moment');

//region [class]

class raw {
    constructor(data = {}) {
        this._default = data.default;

        this._enum = data.enum === null ? undefined : data.enum;
        if (this._enum !== undefined) {
            if (!(this._enum instanceof Array))
                throw `enum must be list`;
            else if (this._enum.length === 0)
                throw `enum cannot be empty`;
        }

        this._allowNull = data.allowNull === undefined ? true : data.allowNull;
        if (typeof this._allowNull !== 'boolean')
            throw `allowNull must be boolean`;

        this._description = data.description === null ? undefined : data.description;
        if (this._description !== undefined && typeof this._description !== 'string')
            throw `description must be string`;
    }

    //region [property]

    get default() {
        return this._default;
    }

    get allowNull() {
        return this._allowNull;
    }

    get description() {
        return this._description;
    }

    get enum() {
        return this._enum;
    }

    //endregion

    //region [method]

    _canBeParameter(options) {
        return true;
    }

    _canBeResponse(options) {
        return true;
    }

    _swaggerType(mode) {
        return {
            type: 'object',
            properties: {},
        }
    }

    _check(value, mode) {
    }

    _parse(value, mode) {
        return value;
    }

    swaggerType(mode) {
        let result = this._swaggerType(mode);

        if (this.default !== undefined)
            result.default = this.default;
        if (this.description !== undefined)
            result.description = this.description;
        if (this.enum !== undefined)
            result.enum = this.enum;

        return result;
    }

    check(value, mode, throwError = false) {
        if (value === undefined || value === null || value === '') {
            if (!this.allowNull) {
                if (throwError)
                    throw `cannot be null`;
                return false;
            }
            return true;
        }

        if (this.enum !== undefined && !this.enum.includes(value)) {
            if (throwError)
                throw `must be ${this.enum}`;
            return false;
        }

        try {
            this._check(value, mode);
            return true;
        } catch (e) {
            if (throwError)
                throw e;
            return false;
        }
    }

    parse(value, mode) {
        this.check(value, mode, true);

        if ((value === undefined || value === null || value === '') && this.allowNull)
            return null;
        if (value === undefined && this.default !== undefined)
            return this.default;

        return this._parse(value, mode);
    }

    //endregion
}

class string extends raw {
    constructor(data = {}) {
        super(data);

        this._trim = data.trim === undefined ? true : data.trim;
        if (typeof this._trim !== 'boolean')
            throw `trim must be boolean`;
    }

    //region [property]

    get trim() {
        return this._trim;
    }

    //endregion

    //region [method]

    _swaggerType(mode) {
        return {type: 'string'};
    }

    _check(value, mode) {
        if (typeof value === 'object')
            throw `cannot convert to string`;
    }

    _parse(value, mode) {
        let result = String(value);
        if (this.trim)
            result = result.trim();

        return result;
    }

    //endregion
}

class number extends raw {
    //region [method]

    _swaggerType(mode) {
        return {type: 'number'};
    }

    _check(value, mode) {
        if (isNaN(parseFloat(value)) || !isFinite(value))
            throw `cannot convert to number`;
    }

    _parse(value, mode) {
        return Number(value);
    }

    //endregion
}

class integer extends number {
    //region [method]

    _swaggerType(mode) {
        return {type: 'integer'};
    }

    _check(value, mode) {
        super._check(value, mode);
        if (!Number.isSafeInteger(Number(value)))
            throw `cannot convert to integer`;
    }

    //endregion
}

class boolean extends raw {
    static parse_boolean(value) {
        let result = undefined;

        if (value === true || value === false)
            result = value;
        else if (value === 1)
            result = true;
        else if (value === 0)
            result = false;
        else if (typeof value === 'string') {
            let str = value.trim().toLowerCase();
            if (str === 'true' || str === '1')
                result = true;
            else if (str === 'false' || str === '0')
                result = false;
        }

        return result;
    }

    //region [method]

    _swaggerType(mode) {
        return {type: 'boolean'};
    }

    _check(value, mode) {
        if (boolean.parse_boolean(value) === undefined)
            throw `cannot convert to boolean`;
    }

    _parse(value, mode) {
        return boolean.parse_boolean(value)
    }

    //endregion
}

class list extends raw {
    constructor(itemType, data = {}) {
        super(data);

        this._itemType = itemType;
        if (this._itemType === undefined || this._itemType === null)
            throw 'itemType of list must be declared';
        if (!(this._itemType instanceof raw))
            throw 'itemType of list is invaild';
    }

    //region [property]

    get itemType() {
        return this._itemType;
    }

    //endregion

    //region [method]

    _canBeParameter(options) {
        return options.method === 'post' || options.method === 'put';
    }

    _swaggerType(mode) {
        return {
            'type': 'array',
            'items': this.itemType.swaggerType(mode),
        };
    }

    _check(value, mode) {
        if (!(value instanceof Array))
            throw `cannot convert to list`;

        for (let item of value) {
            this.itemType.check(item, mode, true)
        }
    }

    _parse(value, mode) {
        let result = [];
        for (let item of value) {
            result.push(this.itemType.parse(item, mode));
        }

        return result;
    }

    //endregion
}

class object extends raw {
    constructor(fields, data = {}) {
        super(data);

        this._fields = fields;
        if (this._fields === undefined || this._fields === null)
            throw 'fields must be declared';
        if (typeof this._fields !== 'object' || Object.keys(this._fields).length === 0)
            throw 'fields is invalid';
        for (let key in this._fields) {
            if (!(this._fields[key] instanceof raw))
                throw 'fields is invalid';
        }
    }

    //region [property]

    get fields() {
        return this._fields;
    }

    //endregion

    //region [method]

    _canBeParameter(options) {
        return options.method === 'post' || options.method === 'put';
    }

    _swaggerType(mode) {
        let result = {
            'type': 'object',
            'properties': {},
        };

        for (let key in this.fields)
            result.properties[key] = this.fields[key].swaggerType(mode);
        return result;
    }

    _check(value, mode) {
        if (typeof value !== 'object')
            throw `cannot convert to object`;

        for (let key in this.fields) {
            if (!value.hasOwnProperty(key))
                continue;
            this.fields[key].check(value[key], mode, true)
        }
    }

    _parse(value, mode) {
        let result = {};
        for (let key in this.fields) {
            if (!value.hasOwnProperty(key)) {
                result[key] = null;
                continue;
            }
            result[key] = this.fields[key].parse(value[key], mode);
        }

        return result;
    }

    //endregion
}

class datetime extends raw {
    //region [method]

    _swaggerType(mode) {
        return {type: 'integer'};
    }

    _check(value, mode) {
        if (mode === 'parameter') {
            if (!moment.unix(Number(value)).isValid())
                throw `cannot convert to datetime`;
        }
        else if (mode === 'result') {
            if (!moment.isMoment(value))
                value = moment.unix(value);
            if (!moment(value).isValid())
                throw `cannot convert to datetime`;
        } else {
            throw `cannot convert to datetime`;
        }
    }

    _parse(value, mode) {
        if (mode === 'parameter') {
            return moment.unix(Number(value));
        } else if (mode === 'result') {
            if (!moment.isMoment(value))
                value = moment.unix(value);
            return value.unix();
        }
    }

    //endregion
}

class file extends raw {
    //region [method]

    _canBeParameter(options) {
        return false;
    }

    //endregion
}

//endregion

const types = [raw, string, number, integer, boolean, list, object, datetime, file];

let moduleExports = {};

for (let type of types) {
    moduleExports[`${type.name}Type`] = type;
}

moduleExports.raw = (data) => new raw(data);
moduleExports.string = (data) => new string(data);
moduleExports.number = (data) => new number(data);
moduleExports.integer = (data) => new integer(data);
moduleExports.boolean = (data) => new boolean(data);
moduleExports.list = (data) => new list(data);
moduleExports.object = (fields, data) => new object(fields, data);
moduleExports.datetime = (data) => new datetime(data);
moduleExports.file = (data) => new file(data);

module.exports = moduleExports;