const BaseModel = require('../core/base-model');
const Util = require('../core/util');
const sequelize = require('sequelize');
const moment = require('moment');
const op = sequelize.Op;

module.exports = class extends BaseModel {
    static get _module() {
        return module;
    }

    static get _schema() {
        return {
            id: {type: sequelize.BIGINT, primaryKey: true, autoIncrement: true},
            mac_address: sequelize.STRING,
            name: sequelize.STRING,
            type: sequelize.STRING,
            hw_version: sequelize.STRING,
            sw_version: sequelize.STRING,
            model: sequelize.STRING,
            menufactuter: sequelize.STRING,
            traits: sequelize.TEXT,
            attri: sequelize.TEXT,
            state: sequelize.TEXT,
            home_id: sequelize.INTEGER
        };
    }

    static async getById(id) {
        return await this.model.findOne({
            where: {
                id: id,
            },
        });
    }

    static async getByAddress(mac_address) {
        return await this.model.findOne({
            where: {
                mac_address: mac_address,
            },
        });
    }

    static async list(page, pageSize, filter) {
        const Db = require('./index');

        //region [filter]

        let where = {};
        if (!filter)
            filter = {};

        if (filter.id)
            where.id = filter.id;
        if (filter.status)
            where.status = filter.status;
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
            order: [['id', 'asc']],
        });
    }

    static async listByHomeId(page, pageSize, home_id) {
        const Db = require('./index');

        let where = {};

        where.home_id = home_id;

        return await super.list(page, pageSize, {
            where: where,
            order: [['id', 'asc']],
        });
    }

    static async listAllByHomeId(home_id) {
        const Db = require('./index');

        let where = {};

        where.home_id = home_id;

        return await super.list(0, 200, {
            where: where,
            order: [['id', 'asc']],
        });
    }

    static async create(item) {
        return await this.model.create(item);
    }

    static async updateState(mac_address, data) {
        let info = await this.getByAddress(mac_address);
        info.name = data.name;
        info.traits = data.traits ;
        info.attri = data.attri ;
        info.state = data.state ;
        await info.save();
        return info;
    }

    static async update_device(mac_address, data) {
        let info = await this.getByAddress(mac_address);
        info.name = data.name;
        await info.save();
        return info;
    }

    static async controlState(mac_address, data) {
        let info = await this.getByAddress(mac_address);
        // info.traits = data.traits ;
        // info.attri = data.attri ;
        info.state = data.state ;
        await info.save();
        return info;
    }

    
};