const Config = require('../config');
const redis = require('redis');

function createClient() {
    return redis.createClient(Config.redis);
}

class Redis {
    //region [static]

    static get(key) {
        return new Promise((res, rej) => {
            createClient().get(
                key,
                (err, val) => {
                    if (err !== null)
                        rej(err);
                    else
                        res(val);
                });
        });
    }

    static set(key, value) {
        return new Promise((res, rej) => {
            createClient().set(
                key,
                value,
                (err) => {
                    if (err !== null)
                        rej(err);
                    else
                        res(value);
                });
        });
    }

    static delete(key) {
        return new Promise((res, rej) => {
            createClient().del(
                key,
                (err) => {
                    if (err !== null)
                        rej(err);
                    else
                        res();
                });
        });
    }

    //endregion
}

module.exports = Redis;