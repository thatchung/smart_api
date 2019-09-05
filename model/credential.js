const Config = require('../config');
const BaseModel = require('../core/base-model');
const Util = require('../core/util');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');
const moment = require('moment');

module.exports = class extends BaseModel {
    static get _module() {
        return module;
    }

    static get _schema() {
        return {
            id: {type: sequelize.BIGINT, primaryKey: true},
            user_id : sequelize.INTEGER,
            source: sequelize.STRING,
            token: sequelize.INTEGER,
        };
    }

     static async getByUserId(user_id) {
        return await this.model.findOne({
            where: {
                user_id: user_id,
            },
        });
    }

    static async getByToken(token) {
        return await this.model.findOne({
            where: {
                token: token,
            },
        });
    }

    static async create(item) {
        return await this.model.create(item);
    }

    static async delete(session) {
        return await session.destroy();
    }

    static async deleteById(user_id) {
        let session = await this.getByUserId(user_id);
        return await this.delete(session);
    }
};