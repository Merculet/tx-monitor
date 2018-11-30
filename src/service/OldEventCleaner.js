const isDev = (process.env.NODE_ENV === 'dev');


module.exports = class OldEventCleaner {


    init() {
        const cfg = this._config;

        const enabled = (cfg.enabled === undefined) ? true : false;
        const checkIntervalBySeconds = cfg.checkIntervalBySeconds || (isDev ? 60 : 1 * 3600); // for prod, 1 hour by default;
        const heightThreshold = cfg.heightThreshold || (isDev ? 3 : 1 * 3600 * 100); // for prod, 36w blocks to keep;

        this.config(enabled, checkIntervalBySeconds, heightThreshold);


        this._blockEventDao = this._beans.load('BlockEventDao');
        this._blockHeightDao = this._beans.load('BlockHeightDao');


        this._scheduleNext();
    }


    config(enabled, checkIntervalBySeconds, heightThreshold) {
        const cfg = this._config;

        if (enabled !== undefined) {
            cfg.enabled = enabled;
        }

        if (checkIntervalBySeconds !== undefined) {
            cfg.checkIntervalBySeconds = checkIntervalBySeconds;
        }

        if (heightThreshold !== undefined) {
            cfg.heightThreshold = heightThreshold;
        }
    }


    _scheduleNext() {

        const cfg = this._config;
        const log = this._logger;
        const me = this;

        setTimeout(async function () {
            if (!cfg.enabled) {
                log.info('disabled');
            } else {
                log.info(`launching cleaner with interval=${cfg.checkIntervalBySeconds}s, 
                heightThreshold=${cfg.heightThreshold}`);

                try {
                    const ctx = {};
                    await me.cleanForAllChannel(ctx);

                    log.info('done');
                } catch (err) {
                    log.error(err);
                }
            }

            await me._scheduleNext();
        }, cfg.checkIntervalBySeconds * 1000);
    }


    async cleanForAllChannel(ctx) {

        const heightEntities = await this._blockHeightDao.findAll(ctx);

        this._logger.info('channels to check: %s', heightEntities);

        for (let heightEntity of heightEntities) {
            await this.cleanByChannel(ctx, heightEntity);
        }

    }


    async cleanByChannel(ctx, heightEntity) {

        const log = this._logger;

        log.info('checking channel: %s', heightEntity);

        const channelId = heightEntity.channelId;
        const maxBlockNumber = heightEntity.height - this._config.heightThreshold;

        if (maxBlockNumber <= 0) {
            log.info('no block events to clear. channelId=' + channelId);
            return;
        }

        log.info('begin to clear block events with height<=%s, channelId=%s', maxBlockNumber, channelId);
        await this._blockEventDao.deleteOlder(ctx, channelId, maxBlockNumber);
        log.info('finish to clear block events with height<=%s, channelId=%s', maxBlockNumber, channelId);
    }

};
