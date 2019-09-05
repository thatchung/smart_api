const request = require('request');
const queryString = require('query-string');

class Request {

    static get(url, options = {}) {
        if (options.parameter !== undefined)
            url = url + "?" + queryString.stringify(options.parameter);
        return new Promise((res, rej) => {
            request({
                method: "GET",
                url: url,
                headers: options.header || {},
            }, (err, data) => {
                if (err !== null)
                    rej(err);
                else
                    res(JSON.parse(data.body));
            });
        });
    }

    static post(url, options = {}) {
        return new Promise((res, rej) => {
            request({
                method: 'POST',
                url: url,
                headers: options.header || {},
                json: options.parameter || {},
            }, (err, data) => {
                if (err !== null)
                    rej(err);
                else
                    res(data.body);
            });
        });
    }

    static put(url, options = {}) {
        return new Promise((res, rej) => {
            request({
                method: 'PUT',
                url: url,
                headers: options.header || {},
                json: options.parameter || {},
            }, (err, data) => {
                if (err !== null)
                    rej(err);
                else
                    res(data.body);
            });
        });
    }

    static delete(url, options = {}) {
        if (options.parameter !== undefined)
            url = url + "?" + queryString.stringify(options.parameter);

        return new Promise((res, rej) => {
            request({
                method: "DELETE",
                url: url,
                headers: options.header || {},
            }, (err, data) => {
                if (err !== null)
                    rej(err);
                else
                    res(JSON.parse(data.body));
            });
        });
    }
}

module.exports = Request;
