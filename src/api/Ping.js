const MissingParamError = require('qnode-error').MissingParamError;


class Ping {

    async validate(ctx) {
        const q = ctx.request.query;

        if (!q.you) throw new MissingParamError('you');
    }


    async execute(ctx) {
        const q = ctx.request.query;
        return 'Hello ' + q.you;
    }

}

Ping.description = 'For heathy check';
Ping.method = 'get';

module.exports = Ping;

