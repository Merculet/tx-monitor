const qerror = require('qnode-error');
const ChannelAPI = require('../common/ChannelAPI');


class Catchup extends ChannelAPI {


    async validateTargetHeight(ctx, channel) {
        const q = ctx.request.query;

        const force = ('true' === q.force);

        if (!q.targetHeight) throw new qerror.MissingParamError('targetHeight');
        const r = parseInt(q.targetHeight, 10);

        const chainHeight = await this.queryChainHeight(channel);

        if (r >= chainHeight + 100) {
            // protect from accidently huge catchup
            if (!force) throw new qerror.RequestError('CANNOT_SYNC_MUCH');
        }

        return r;
    }


    async validate(ctx) {
        const r = await super.validate(ctx);

        r.targetHeight = await this.validateTargetHeight(ctx, r.channel);

        return r;
    }


    execute(ctx, { channel, targetHeight }) {
        return this.blockEventListener.tryToCatchUp(ctx, channel, targetHeight);
    }

}

Catchup.description = 'Catch up to target block height. To protect, targetHeight is limited to current block height + 100';
Catchup.method = 'get';

module.exports = Catchup;

