const Config = require('../config');
const elasticsearch = require('elasticsearch');

class Elastic {
    static createClient(){
        return (new elasticsearch.Client({
            host: Config.elastic.host + ':' + Config.elastic.port,
            maxRetries: 10, 
            requestTimeout: 60000,
            deadTimeout: 120000,
            // sniffOnStart: true,
            keepAlive: false
          }))
    }
    static init(data) {
        let instance = new Elastic();

        instance._index = data.index;
        instance._doctype = data.doctype || null;
        instance._filter_must = data.filter_must || [];
        instance._filter_should = data.filter_should || [];
        instance._filter_must_not = data.filter_must_not || [];
        instance._sort = data.sort || [];
        instance._aggs = data.aggs || {};
        instance._start = data.start || 0;
        instance._size = data.size || 10;
        instance._search_after = data.search_after || [];
        instance._minimum_should_match = data.minimum_should_match || null;

        return instance;
    }

    //region [property]

    get query_body() {
        let query = {
            'query': {
                'bool': {
                    'must': this._filter_must,
                    'should': this._filter_should,
                    'must_not': this._filter_must_not,
                }
            }
        };

        if (this._start !== null)
            query.from = this._start;

        if (this._size !== null)
            query.size = this._size;

        if (this._sort !== null)
            query.sort = this._sort;

        if(this._filter_must.length > 0 && this._filter_should.length >0)
            query.query.bool.minimum_should_match = 1

        if (this._minimum_should_match !== null)
            query.query.bool.minimum_should_match = this._minimum_should_match;

        if (this._aggs !== null)
            query.aggs = this._aggs;

        if (this._search_after !== null)
            query.search_after = this.__search_after;

        return query;
    }

    get index() {
        return this._index
    };

    get doctype() {
        return this._doctype
    };

    get filter_must() {
        return this._filter_must
    };

    get filter_should() {
        return this._filter_should
    };

    get filter_must_not() {
        return this._filter_must_not
    };

    get sort() {
        return this._sort
    };

    get aggs() {
        return this._aggs
    };

    get start() {
        return this._start
    };

    get search_after() {
        this._search_after = value;
    };

    set start(value) {
        if (typeof value !== 'number')
            throw '\'start\' parameter must be number';

        this._start = value;
    };

    set size(value) {
        if (typeof value !== 'number')
            throw '\'size\' parameter must be number';

        this._size = value;
    };

    set search_after(value) {
        this._search_after = value;
    };

    set minimum_should_match(value) {
        if (value !== null && typeof value !== 'number')
            throw '\'minimum should match\' parameter must be number';

        this._minimum_should_match = value;
    };

    //endregion

    //region [static]

    static async indicesSetup(index, data) {
        if (!Config.elastic.enable)
            return false
        if (await Elastic.indicesExists(index))
            return false
        return await new Promise((res, rej) => {
            Elastic.createClient().indices.create({
                    index:  index,
                    body: data
                },
                (err, result) => {
                    if (err) { console.log(err); res(false); } else { res(result) };
                })
            })
    }

    static async indicesExists(index) {
        return await Elastic.createClient().indices.exists({index:  index})
    }

    static getEsIndex(key){
        return Config.elastic.prefix + key
    }

    static async esBulk(data, refresh=true){
        // return await new Promise((res, rej) => {
        //     Elastic.createClient().bulk({"body": data, refresh: refresh}, (err, result) => {
        //         if (err) rej(err); else res(result);
        //     });
        // })
        return await Elastic.createClient().bulk({"body": data, refresh: refresh});
    }

    exists(id) {
        return new Promise((res, rej) => {
            Elastic.createClient().exists({
                index:  this._index,
                type: this._doctype !== null ? this._doctype : this._index,
                id: id,
            }, (err, result) => {
                if (err) rej(err); else res(result);
            });
        });
    }

    get(id, options = {}) {
        return new Promise((res, rej) => {
            Elastic.createClient().get({
                index:  this._index,
                type: this._doctype !== null ? this._doctype : this._index,
                id: id,
            }, (err, result) => {
                if (err) {
                    if (err.statusCode === 404)
                        res(null);
                    else
                        rej(err);
                    return;
                }

                if (options.raw)
                    res(result);
                res(result._source);
            });
        });
    }

    set(id, data) {
        return new Promise(async (res, rej) => {
            if (await this.exists(id)) {
                Elastic.createClient().update({
                    index:  this._index,
                    type: this._doctype !== null ? this._doctype : this._index,
                    id: id,
                    body: {doc: data},
                    refresh: true
                }, (err, data) => {
                    if (err) {res(false); console.log(err);} else {res(data);}
                });
            } else {
                Elastic.createClient().create({
                    index:  this._index,
                    type: this._doctype !== null ? this._doctype : this._index,
                    id: id,
                    body: data,
                    refresh: true
                }, (err, data) => {
                    if (err) {res(false); console.log(err);} else {res(data);}
                });
            }
        });
    }

    delete(id) {
        return new Promise(async (res, rej) => {
            if (!await this.exists(id))
                res(false)
            Elastic.createClient().delete({
                index:  this._index,
                type: this._doctype !== null ? this._doctype : this._index,
                id: id,
                refresh: true
            }, (error, response) => {
                if (error) res(false); else res(response.found);
            });
        })
    }

    static async deleteIndex(index) {
        return await Elastic.createClient().indices.delete({index:  index})
    }

    deleteIndex() {
        return new Promise(async (res, rej) => {
            let index =  this._index;
            try {
                if (!await Elastic.indicesExists(this._index))
                    res(false)
                res(await Elastic.createClient().indices.delete(index));
            } catch(e){rej(e)}
        })
    }

    async search(o = {}) {
        if(!await Elastic.indicesExists(this._index))
            return []
        let data = await Elastic.createClient().search({
            index:  this._index,
            type: this._doctype,
            body: this.query_body,
        });

        if (o.raw === true)
            return data;

        let result = [];
        for (let hit of data.hits.hits)
            result.push(hit._source);
        return result;
    }

    async searchFirst(o = {}) {
        if(!await Elastic.indicesExists(this._index))
            return null
        let data = await this.search(o);
        if (o.raw === true)
            data = data.hits.hits;

        if (data.length === 0)
            return null;
        return data[0];
    }

    async count() {
        if(!await Elastic.indicesExists(this._index))
            return 0
        let {count} = await Elastic.createClient().count({
            index:  this._index,
            body: {query: this.query_body.query}
        });
        return count
    }

    async aggregate() {
        if(!await Elastic.indicesExists(this._index))
            return null
        let result = await Elastic.createClient().search({
            index:  this._index,
            type: this._doctype,
            body: this.query_body,
        });
        return result.aggregations;
    }

    async aggregate_basic() {
        if(!await Elastic.indicesExists(this._index))
            return null
        let result = await Elastic.createClient().search({
            index:  this._index,
            type: this._doctype,
            body: this.query_body,
        });
        return result;
    }
    //endregion
}

module.exports = Elastic;
