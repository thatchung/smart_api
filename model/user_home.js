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
            user_id: sequelize.INTEGER,
            home_id: sequelize.INTEGER
        };
  	}

    static async getByUserId(user_id) {
        return await this.model.findOne({
            where: {
                user_id: user_id,
            },
        });
    }

  	// static _associations(models) {
   //      this.model.belongsTo(models.user.model, {foreignKey: 'user_id'});
   //  }


    static async create(item) {
        return await this.model.create(item);
    }

    static async delete(whereObject) {
        return await this.model.destroy({
            where: whereObject,
        });
    }
};