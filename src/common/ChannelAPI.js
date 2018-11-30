const qerror = require('qnode-error');


class ChannelAPI {


    init() {
        this.blockEventListener = this._beans.load('BlockEventListener');
    }


    _loadChannel(channelId) {
        if (!channelId) throw new qerror.MissingParamError('channelId');
        const r = this.blockEventListener.getChannel(channelId);
        if (!r) throw new qerror.RequestError('CHANNEL_NOT_FOUND', channelId);
        return r;
    }


    async validate(ctx) {
        const channel = await this._loadChannel(ctx.request.query.channelId);
        return { channel };
    }


    async queryChainHeight(channel) {
        return await this.blockEventListener.queryBlockHeight(channel);
    }

}

module.exports = ChannelAPI;

