const Kafka = require('node-rdkafka');
const KafkaClient = require('./KafkaClient');

const isDev = (process.env.NODE_ENV === 'dev');


module.exports = class KafkaSender extends KafkaClient {


    normalizeConfig(config) {
        const debug = this._logger.isDebugEnabled();

        if (config.flushAtOnce === undefined) config.flushAtOnce = false;
        if (config.flushTimeout === undefined) config.flushTimeout = 10 * 1000;
        if (config.pollInterval === undefined) config.pollInterval = 2 * 1000;

        if (config.listenMoreEvents === undefined && debug) config.listenMoreEvents = true;

        const options = config.options;

        if (options.dr_cb === undefined) options.dr_cb = true; // Specifies that we want a delivery-report event to be generated
    }


    async init() {
        await super.init();

        const log = this._logger;

        const cfg = this._config;
        this.normalizeConfig(cfg);
        log.info('configuration: %s', cfg);

        const producer = this._producer = new Kafka.Producer(cfg.options);

        // Poll for events
        producer.setPollInterval(cfg.pollInterval);
        producer.on('delivery-report', (err, report) => {
            // Report of delivery statistics here. Note, need set dr_cb=true
            if (err) log.error('delivery-report: err=%s, report=%s', err, report);
            else log.info('delivery-report: %s', report);
        });
        if (cfg.listenMoreEvents) this.listenMoreEvents(producer);

        log.info('connecting...');
        producer.connect();

        // Any errors we encounter, including connection errors
        producer.on('event.error', err => {
            log.warn('event.error: %s', err);
        });

        await this.waitForReady(producer);
    }


    async send(ctx, blockEvent) {
        const msg = isDev ? JSON.stringify(blockEvent, null, 4) : JSON.stringify(blockEvent);

        const topicName = this._config.topics[blockEvent.channelId];
        if (!topicName) {
            throw new Error('no topic name configured for channel: ' + blockEvent.channelId);
        }

        this._producer.produce(
            // Topic to send the message to
            topicName,

            // optionally we can manually specify a partition for the message,
            // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
            null,

            // Message to send. Must be a buffer
            new Buffer(msg)
        );

        if (this._config.flushAtOnce) {
            await new Promise((resolve, reject) => {
                this._producer.flush(this._config.flushTimeout, err => {
                    if (err) {
                        this._logger.error('failed to flush message: %s', err);
                        return reject(err);
                    }
                    resolve();
                });
            });
        }
    }

};
