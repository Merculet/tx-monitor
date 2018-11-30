const Kcors = require('kcors');
const qrest = require('qnode-rest');


module.exports = class ApiServer extends qrest.ApiServer {


    prepare() {
        this._koa.use(Kcors());

        super.prepare();
    }


    _findAllApiFiles() {
        return ['Ping', 'Catchup', 'Sync', 'SyncRange'];
    }

};
