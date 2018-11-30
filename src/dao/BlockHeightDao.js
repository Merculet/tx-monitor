'use strict';

const qmysql = require('qnode-mysql');

module.exports = class BlockHeightDao extends qmysql.orm.MySqlDao {

    constructor() {
        super('BlockHeight');
    }


    findByChannelId(ctx, channelId) {
        const where = { channelId };
        return this.findOne(ctx, { where });
    }

};
