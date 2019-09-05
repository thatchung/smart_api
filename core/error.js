const Config = require('../config');

class Error {
    constructor(e) {
        if (e instanceof Error) {
            this.exception = e.exception;
            this.code = e.code;
            this.message = e.message;
            this.data = e.data;
            return;
        }

        this.exception = e;
        this.code = 'exception';
        this.message = Config.isDevelopment && e.toString() !== '[object Object]' ? e.toString() : undefined;
        this.data = null;

        if (typeof e === 'object') {
            if (e.hasOwnProperty('exception'))
                this.exception = e.exception === undefined ? null : e.exception;
            if (e.hasOwnProperty('code') && e.code !== undefined && e.code !== null && e.code !== '')
                this.code = e.code;
            if (e.hasOwnProperty('message') && e.message !== undefined && e.message !== null && e.message !== '')
                this.message = e.message;
            if (e.hasOwnProperty('data') && e.data !== undefined)
                this.data = e.data;

            if (typeof this.message === 'undefined' && e.exception && e.exception.toString() !== '[object Object]')
                this.message = e.exception.toString();
            if (!this.message)
                this.message = 'exception';
        }

        if (typeof e === 'string')
            this.exception = null;
        else if (Object.keys(e).length === 2 && e.hasOwnProperty('code') && e.hasOwnProperty('message'))
            this.exception = null;
        else if (Object.keys(e).length === 3 && e.hasOwnProperty('code') && e.hasOwnProperty('message') && e.hasOwnProperty('data'))
            this.exception = null;
        else if (Object.keys(this).length - 1 === Object.keys(this.exception).length)
            this.exception = null;

        if (typeof this.message === 'undefined')
            this.message = 'unknown exception';
    }
}

module.exports = {
    make: (e) => new Error(e),
    isError: (o) => o instanceof Error,
};