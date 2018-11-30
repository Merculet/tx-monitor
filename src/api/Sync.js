const qerror = require('qnode-error');
const ChannelAPI = require('../common/ChannelAPI');


class Sync extends ChannelAPI {


    async validate(ctx) {
        const r = await super.validate(ctx);

        const q = ctx.request.query;
        if (!q.blockNumber) throw new qerror.MissingParamError('blockNumber');
        r.blockNumber = parseInt(q.blockNumber, 10);

        return r;
    }


    async execute(ctx, { channel, blockNumber }) {
        return this.blockEventListener.syncWithBlock(channel, blockNumber);
    }

}

Sync.description = 'Sync up block events with specific block number';
Sync.method = 'get';

module.exports = Sync;

