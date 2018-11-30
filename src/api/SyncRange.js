const qerror = require('qnode-error');
const ChannelAPI = require('../common/ChannelAPI');


class SyncRange extends ChannelAPI {


    async validate(ctx) {
        const r = await super.validate(ctx);

        const q = ctx.request.query;

        const force = ('true' === q.force);

        if (!q.blockNumberMin) throw new qerror.MissingParamError('blockNumberMin');
        const blockNumberMin = r.blockNumberMin = parseInt(q.blockNumberMin, 10);
        if (blockNumberMin < 0) throw new qerror.MissingParamError('blockNumberMin SHOULD NOT be negative');


        const chainHeight = await this.queryChainHeight(r.channel);


        if (!q.blockNumberMax) throw new qerror.MissingParamError('blockNumberMax');
        const blockNumberMax = r.blockNumberMax = parseInt(q.blockNumberMax, 10);
        if (blockNumberMax >= chainHeight + 100) {
            // protect from accidently huge sync range
            if (!force) throw new qerror.RequestError('CANNOT_SYNC_MUCH');
        }
        if (blockNumberMin > blockNumberMax) {
            throw new qerror.MissingParamError('blockNumberMin SHOULD NOT be greater than blockNumberMax');
        }


        if ((blockNumberMax - blockNumberMin) >= 100) {
            // protect from accidently huge sync range
            if (!force) throw new qerror.RequestError('CANNOT_SYNC_MUCH');
        }

        return r;
    }


    async execute(ctx, { channel, blockNumberMin, blockNumberMax }) {
        for (let blockNumber = blockNumberMin; blockNumber <= blockNumberMax; blockNumber++) {
            await this.blockEventListener.syncWithBlock(channel, blockNumber);
        }
    }

}

SyncRange.description = 'Sync up block events with specific block number range. To protect, `blockNumberMax` is limited to current block height + 100, and `(blockNumberMax-blockNumberMin)` must be <=100';
SyncRange.method = 'get';

module.exports = SyncRange;

