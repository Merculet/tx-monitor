/* eslint no-unused-vars:'off' */
/* eslint global-require:'off' */
const qconfig = require('qnode-config');
global.config = qconfig.load();

const qerror = require('qnode-error');
qerror.Errors.register(1001, 2000, './src/ErrorCode');

const qbeans = require('qnode-beans');

const Logger = require('qnode-log');
const logger = new Logger('App');


class App {

    constructor() {
        const beans = this._beans = new qbeans.Beans();

        this.apiServer = beans.create('./ApiServer');

        this.blockEventListener = beans.create('./fabric/BlockEventListener');
        beans.create('./dao/BlockEventDao');
        beans.create('./dao/BlockHeightDao');
        beans.create('./service/BlockEventService');
        beans.create('./service/OldEventCleaner');
        beans.create('./kafka/KafkaSender');
    }


    async start() {
        logger.info('starting...');

        await this._beans.init();
        logger.info('beans inited');

        await this.blockEventListener.start();

        await this.apiServer.start();

        logger.info('started');
    }

}


const isMainModule = (process.mainModule.filename === module.filename);
if (isMainModule) {
    try {
        const app = new App();
        app.start();
    } catch (e) {
        if (e instanceof qerror.BaseError) {
            logger.error(e.build('en-US').message);
        }

        logger.error(e.stack);

        /* eslint no-process-exit:off */
        process.exit(1);
    }
}

module.exports = App;
