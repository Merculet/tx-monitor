const Kafka = require('node-rdkafka');

const qconfig = require('qnode-config');
global.config = qconfig.load();

const qerror = require('qnode-error');
qerror.Errors.register(1001, 2000, './src/ErrorCode');

const qbeans = require('qnode-beans');

const Logger = require('qnode-log');
const log = new Logger('App');
log.info('initing...');

const KafkaClient = require('../src/kafka/KafkaClient');

const isDev = (process.env.NODE_ENV === 'dev');


/**
 * Only for verification purpose
 */
class KafkaConsumer extends KafkaClient {


    normalizeConfig(config) {
        const debug = this._logger.isDebugEnabled();

        if (config.pollInterval === undefined) config.pollInterval = 2 * 1000;
        if (config.listenMoreEvents === undefined && debug) config.listenMoreEvents = true;

        const options = config.options;

        if (options['group.id'] === undefined) options['group.id'] = 'kafka';
    }


    async init() {
        await super.init();

        const log = this._logger;

        const cfg = this._config;
        this.normalizeConfig(cfg);
        log.info('configuration: %s', cfg);

        const consumer = this._consumer = new Kafka.KafkaConsumer(cfg.options);

        if (cfg.listenMoreEvents) this.listenMoreEvents(consumer);

        log.info('connecting...');
        consumer.connect();

        await this.waitForReady(consumer);

        const topicNames = [];
        for (let channelName in this._config.topics) {
            topicNames.push(this._config.topics[channelName]);
        }

        consumer.subscribe(topicNames);
        log.info('subscribe ready: %s', topicNames);

        consumer.consume();
        log.info('consume ready');

        consumer.on('data', data => {
            log.info('data: %s', data.value.toString());
        });
    }

};


const beans = new qbeans.Beans();
const kafkaConsumer = beans.create(KafkaConsumer, 'KafkaConsumer');

beans.init()
    .then(() => log.info('inited'))
    .catch(err => log.error(err));

