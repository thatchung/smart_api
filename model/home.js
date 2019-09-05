const BaseModel = require('../core/base-model');
const Util = require('../core/util');
const sequelize = require('sequelize');
const op = sequelize.Op;
const moment = require('moment');

module.exports = class extends BaseModel {
    static get _module() {
        return module;
    }

    static get _schema() {
        return {
            id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
            name: sequelize.STRING,
            owner_id: sequelize.INTEGER
        };
  	}

    static async list(page, pageSize, filter) {
        const Db = require('./index');

        //region [filter]

        let where = {};
        if (!filter)
            filter = {};

        if (filter.id)
            where.id = filter.id;
        if (filter.search)
        {
            let conditions = [];
            if (Number.isInteger(Number(filter.search)))
                conditions.push({id: parseInt(filter.search)});
            conditions.push({name: {like: `%${filter.search}%`}});

            where[op.or] = conditions;
        }

        return await super.list(page, pageSize, {
            where: where,
            order: [['name', 'desc']],
        });
    }

    static async getById(id) {
        return await this.model.findOne({
            where: {
                id: id,
            },
        });
    }

    static async getByUserId(user_id) {
        return await this.model.findOne({
            where: {
                owner_id: user_id,
            },
        });
    }

    static async getByName(name) {
        return await this.model.findOne({
            where: {
                name: name,
            },
        });
    }

    static async create(item) {
        return await this.model.create(item);
    }

    static async update(id,name,owner_id) {
        let temp = await this.getById(id);
        temp.name = name;
        temp.owner_id = owner_id;
        await temp.save();

        return temp;
    }
};