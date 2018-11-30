'use strict';

const qmysql = require('qnode-mysql');

module.exports = class BlockEventDao extends qmysql.orm.MySqlDao {

    constructor() {
        super('BlockEvent');
    }


    findByChannelIdAndBlockNumber(ctx, channelId, blockNumber) {
        const where = { channelId, blockNumber };
        return this.findOne(ctx, { where });
    }


    deleteOlder(ctx, channelId, maxBlockNumber) {
        const sql = `DELETE FROM block_event WHERE channel_id=:channelId AND block_number <= :maxBlockNumber`;
        const options = {
            replacements: {
                channelId,
                maxBlockNumber
            }
        };
        return this.rawDELETE(ctx, sql, options);
    }


};

