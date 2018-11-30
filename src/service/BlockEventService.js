module.exports = class BlockEventService {


    init() {
        this._blockEventDao = this._beans.load('BlockEventDao');
        this._blockHeightDao = this._beans.load('BlockHeightDao');
        this._kafkaSender = this._beans.load('KafkaSender');
    }


    async processBlockEvent(blockEvent) {
        const ctx = {};
        const log = this._logger, debug = log.isDebugEnabled();

        const blockNumber = blockEvent.blockNumber;

        if (debug) log.debug('begin to process block event: \n%s', blockEvent);
        else log.info('begin to process block event: %s', blockNumber);

        const existing = await this._findExisting(ctx, blockEvent.channelId, blockNumber);

        await this._saveHeight(ctx, existing.heightEntity, blockEvent);

        if (existing.isDuplicated) {
            log.info('found duplicated block, block number=%s, perhaps due to another running tx-monitor', blockNumber);
            return;
        }
        if (debug) log.debug('got block event to save and forward: \n%s', blockEvent);

        // save first then send to queue, don't do that reversely
        // because:
        // 1. if save failed, then send to queue won't happen
        // 2. if failed to send to queue, save will be rollbacked
        await this._saveEvent(ctx, blockEvent);

        this._formatBlockEvent4Forwarding(blockEvent);

        await this._forwardToQueue(ctx, blockEvent);
        log.info('block event is forwarded to queue. block number=%s', blockNumber);

    }


    async _formatBlockEvent4Forwarding(blockEvent) {

        if (blockEvent.publishedAt) blockEvent.publishedAt = blockEvent.publishedAt.getTime();
        if (blockEvent.receivedAt) blockEvent.receivedAt = blockEvent.receivedAt.getTime();

        blockEvent.transactions.forEach(tx => {
            if (tx.timestamp) tx.timestamp = new Date(tx.timestamp).getTime();
        });
    }


    async _forwardToQueue(ctx, blockEvent) {
        await this._kafkaSender.send(ctx, blockEvent);
    }


    async _findExisting(ctx, channelId, blockNumber) {
        const results = await Promise.all([
            this._blockEventDao.findByChannelIdAndBlockNumber(ctx, channelId, blockNumber),
            this._blockHeightDao.findByChannelId(ctx, channelId)
        ]);

        const eventEntity = results[0];

        return {
            eventEntity,
            heightEntity: results[1],
            isDuplicated: (eventEntity !== undefined && eventEntity !== null)
        };
    }


    async _saveHeight(ctx, existingHeightEntity, blockEvent) {
        const log = this._logger, debug = log.isDebugEnabled();

        const blockNumber = blockEvent.blockNumber;
        const channelId = blockEvent.channelId;

        if (existingHeightEntity) {
            if (existingHeightEntity.height < blockNumber) {
                await this._blockHeightDao.update(ctx, existingHeightEntity, { height: blockNumber });

                if (debug) log.debug('update height, height=%s, channelId=%s', blockNumber, channelId);
            }
        } else {
            const newHeightEntity = {
                channelId,
                height: blockNumber
            };
            await this._blockHeightDao.insert(ctx, newHeightEntity);

            if (debug) log.debug('insert height, height=%s, channelId=%s', blockNumber, channelId);
        }
    }


    async _saveEvent(ctx, blockEvent) {
        const log = this._logger, debug = log.isDebugEnabled();

        const blockNumber = blockEvent.blockNumber;
        const channelId = blockEvent.channelId;

        await this._blockEventDao.insert(ctx, {
            channelId,
            blockNumber,
            receivedAt: blockEvent.receivedAt,
            publishedAt: blockEvent.publishedAt,
            detail: JSON.stringify(blockEvent)
        });

        if (debug) log.debug('insert event, height=%s, channelId=%s', blockNumber, channelId);
    }


    async getBlockHeight(ctx, channelId) {
        const entity = await this._blockHeightDao.findByChannelId(ctx, channelId);
        if (!entity) return 0;
        return entity.height;
    }

};
