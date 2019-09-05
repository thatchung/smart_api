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
			name : sequelize.STRING,
			email : sequelize.STRING,
			phone : sequelize.STRING,
			password : sequelize.STRING,
			photo_url : sequelize.STRING,
        };
    }

    static async getById(id) {
        return await this.model.findOne({
            where: {
                id: id,
            },
        });
    }

    static async getCheckUser(email,phone) {
        let where = {};
        let conditions = [];
        if(email)
            conditions.push({ email : email });
        if(phone)
            conditions.push({ phone : phone });

        where[op.or] = conditions;
        return await this.model.findOne({
            where: where,
        });
    }

    static async getCheckEmailUsed(email) {
        let num = await this.model.count({
            where: {
                email: email,
            },
        });
        if(num > 1)
            return false;
        return true
    }

    static async getCheckPhoneUsed(phone) {
        let num = await this.model.count({
            where: {
                phone: phone,
            },
        });
        if(num > 1)
            return false;
        return true
    }


    static async getByLoginEmail(email, pass) {
        const Util = require('../core/util');

        return await this.model.findOne({
            where: {
                email: email,
                password: Util.sha3_512Hash(pass ? pass : ''),
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
            order: [['id', 'desc']],
        });
    }

    static async create(item) {
        item.password = Util.sha3_512Hash(item.password);
        return await this.model.create(item);
    }

    static async update(id, data) {
        let info = await this.getById(id);
        info.name = data.name;
        if(data.email)
            info.email = data.email;
        if(data.phone)
		  info.phone = data.phone;
        if(data.photo_url)
            info.photo_url = data.photo_url;
        if(data.password)
        {
            info.password = Util.sha3_512Hash(data.password);
        }
        await info.save();
        return info;
    }
};