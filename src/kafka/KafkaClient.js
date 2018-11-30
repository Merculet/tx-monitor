const Kafka = require('node-rdkafka');


module.exports = class KafkaClient {


    async init() {
        this._logger.info('node-rdkafka: %s', {
            features: Kafka.features,
            librdkafkaVersion: {
                librdkafkaVersion: Kafka.librdkafkaVersion
            }
        });

        const cfg = this._config;

        if (!cfg.topics) {
            this._config.topics = {
                'composerchannel': 'merculet_blockevents_composerchannel'
            };
        }

        const options = cfg.options;
        if (!options) throw new Error('<options> not specified');

        const brokers = options['metadata.broker.list'];
        if (!brokers) throw new Error('<options>.<metadata.broker.list> not specified');
    }


    queryTopicMetadata(producerOrConsumer, topic) {
        this._logger.info('retrieve metadata on topic %s...', topic);

        return new Promise((resolve, reject) => {
            producerOrConsumer.getMetadata(
                { topic, timeout: 2000 },
                (err, metadata) => {
                    if (err) {
                        this._logger.error('error getting metadata');
                        return reject(err);
                    }
                    this._logger.info('got metadata: \n%s', metadata);
                    resolve();
                });
        });
    }


    // Wait for the ready event before proceeding
    waitForReady(producerOrConsumer) {

        return new Promise((resolve, reject) => {
            producerOrConsumer.on('ready', async () => {
                this._logger.info('ready, begin to query metadata...');

                producerOrConsumer.getMetadata(
                    { timeout: 2000 },
                    (err, metadata) => {
                        if (err) {
                            this._logger.error('error getting metadata');
                            return reject(err);
                        }
                        this._logger.info('got metadata: %s', metadata);
                        resolve();
                    });
            });
        });
    }


    listenMoreEvents(producerOrConsumer) {
        const log = this._logger;

        producerOrConsumer.on('disconnected', () => {
            log.info('disconnected: %s', arguments);
        });

        producerOrConsumer.on('event', () => {
            log.info('event: %s', arguments);
        });

        producerOrConsumer.on('event.log', () => {
            log.info('event.log: %s', arguments);
        });

        producerOrConsumer.on('event.stats', () => {
            log.info('event.stats: %s', arguments);
        });

        producerOrConsumer.on('event.throttle', () => {
            log.info('event.throttle: %s', arguments);
        });
    }

};
