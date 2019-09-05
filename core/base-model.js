const Config = require('../config');
const sequelize = require('sequelize');
const path = require('path');
const Elastic = require('./elastic');

module.exports = class {
    static get tableName() {
        return path.basename(this._module.filename).split('.')[0];
    }

    static get db() {
        if (!this._db)
            this._db = new sequelize(Config.database.dbname, Config.database.username, Config.database.password,
                Object.assign({
                    operatorsAliases: sequelize.Op
                }, Config.database.info));

        return this._db;
    }

    static get model() {
        if (!this._model) {
            let options = {
                charset: 'utf8',
                collate: 'utf8_unicode_ci',
                freezeTableName: true,
                timestamps: false,
                underscored: true,
            };

            this._model = this.db.define(this.tableName, this._schema, options);

            // if(this.testttt){
            //     if(this.db.ticket_channel)
            //     {
            //         this._model.hasOne(this.db.ticket_channel.model, {foreignKey: 'ticket_channel_id', as : 'channel'});
            //     }
            //     else{
            //         var Channell = this.db.define('ticket_channel', {
            //             id: {type: sequelize.BIGINT, primaryKey: true, autoIncrement: true},
            //             name: sequelize.STRING,
            //         }, options);
            //         console.log(Channell);
            //         this._model.hasOne(Channell, {foreignKey: 'ticket_channel_id', as : 'channel'});
            //     }
            //     console.log(this.db.ticket_channel);
            // }

        }
        // console.log(this._model);
        // if(this._hasOne){


            
        //}

        return this._model;
    }

    static async hasOne(model,options) {
        this.model.hasOne(model, options);
    }

    static async esMapping(index, mapping){
        let result = false;
        if(!await Elastic.indicesExists(index))
            result = await Elastic.indicesSetup(index, mapping);
        return result
    }

    static async list(page = 1, pageSize = 10, options = {}) {
        let data = Object.assign({
            offset: (page - 1) * pageSize,
            limit: pageSize,
        }, options);

        return await this.model.findAndCountAll(data);
    }

    static async listAll(options = {}) {
        let data = Object.assign(options);

        return await this.model.findAndCountAll(data);
    }

    static async getCountAll(options = {}) {
        
        return await this.model.count(options);
    }

    static async listGroupAll(options = {}) {

        return await this.model.findAll(options);
    }
};