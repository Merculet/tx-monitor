'use strict';

const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
const HLFConnectionManager = require('composer-connector-hlfv1');
const BlockHelper = require('./BlockHelper');
const TxValidationCode = require('./TxValidationCode');


module.exports = class BlockEventListener {


	async init() {

		this.blockEventService = this._beans.load('BlockEventService');

		this.connectOptions = await this.buildConnectOptions();
		this.fabricClient = await this.loginAsClient(this.connectOptions);

		this.eventHub = this.buildEventHub(this.fabricClient, this.connectOptions);
	}


	async buildConnectOptions() {

		const cardName = `${this._config.userName}@${this._config.networkName}`;
		this._logger.info('using composer card name:\t' + cardName);

		const cardStore = NetworkCardStoreManager.getCardStore();

		const card = await cardStore.get(cardName);
		this._logger.info('composer card: \n' + JSON.stringify(card, null, 4));

		const additionalConnectOptions = {
			wallet: await cardStore.getWallet(cardName),
			cardName
		};

		return Object.assign(card.getConnectionProfile(), additionalConnectOptions);
	}


	async loginAsClient(connectOptions) {

		const r = await HLFConnectionManager.createClient(connectOptions, true);

		// setup the fabric network
		const org = connectOptions.client.organization;
		const orgPeers = connectOptions.organizations[org].peers;

		for (let channelId in connectOptions.channels) {
			const ch = r.newChannel(channelId);

			for (let peerName in connectOptions.peers) {
				if (orgPeers.indexOf(peerName) < 0) continue;

				const peer = connectOptions.peers[peerName];
				const options = peer.tlsCACerts ? { pem: peer.tlsCACerts.pem } : undefined;
				ch.addPeer(r.newPeer(peer.url, options));
			}
		}

		// get the enrolled user from persistence, this user will sign all requests
		const userName = this._config.userName;
		const user = this.user = await r.getUserContext(userName, true);
		if (!user || !user.isEnrolled()) {
			throw new Error('failed to get ' + userName);
		}

		this._logger.info('login as:\t' + userName);

		return r;
	}


	buildEventHub(fabricClient, connectOptions) {

		const r = fabricClient.newEventHub();

		const org = connectOptions.client.organization;
		const orgPeers = connectOptions.organizations[org].peers;

		for (let peerName in connectOptions.peers) {
			if (orgPeers.indexOf(peerName) < 0) continue;

			const peer = connectOptions.peers[peerName];
			const options = peer.tlsCACerts ? { pem: peer.tlsCACerts.pem } : undefined;
			r.setPeerAddr(peer.eventUrl, options);//TODO: how to handle repeating block events from multiple peers
		}

		r.connect();
		this._logger.info('connecting to event hub');

		return r;
	}


	_checkTransactionType(type) {
		if (type !== 3) {
			// ignore non-endorser tx
			return false;
		}

		return true;
	}


	_populateTransactionStatusCode(event) {
		// check tx status
		const code = TxValidationCode.fromTxStatus(event.status);
		if (!code) {
			return false;
		}

		event.code = code;
		event.valid = ('VALID' === code);

		return true;
	}


	_buildTransactionEvent(index, tx, status) {

		const log = this._logger, debug = log.isDebugEnabled();

		const h = BlockHelper.transactionHeader(tx), id = h.tx_id;

		const e = {
			id, index, status,
			code: '',
			timestamp: h.timestamp,
			type: h.type,
			typeString: h.typeString,
			valid: false
		};

		log.info(`got tx, index=${index}, txId=${id}, timestamp=${e.timestamp}, status=${status}`);

		// check tx type
		if (!this._checkTransactionType(e.type)) {
			if (debug) log.debug(`non-endorser tx, txId=${id}, type=${e.type}, typeString=${h.typeString}`);
			return { shouldIgnore: true, event: e };
		}

		// check tx status
		if (!this._populateTransactionStatusCode(e)) {
			log.warn(`unexpected tx status, status=${e.status}, txId=${id}`);
			return { shouldIgnore: true, event: e };
		}

		if (e.valid) log.debug('found valid tx, txId=' + id);
		else log.warn('found INVALID tx, txId=' + id);

		// retrieve proposal input
		const input = BlockHelper.transactionInput(tx);
		if (!input) {
			log.warn('cannot find input, txId=' + id);
			return { shouldIgnore: true, event: e };
		}

		// input is a Buffer, so far not useful for us

		//const args = input.toString().split('\n');
		//console.log('tx input: ' + JSON.stringify(args));
		if (debug) log.debug('tx input: ' + input.toString());

		return { shouldIgnore: false, event: e };
	}


	_parseBlockEvent(block, connectOptions) {

		const receivedAt = new Date(), blockNumber = BlockHelper.number(block);

		const log = this._logger, debug = log.isDebugEnabled();
		log.info('got block, block-no=' + blockNumber);

		// ensure received expected channel only
		const channelId = BlockHelper.channelId(block);
		if (!(connectOptions.channels[channelId])) throw new Error('unknown channel, channel-id=' + channelId);

		const statusList = BlockHelper.transactionStatusList(block);
		if (!statusList) throw new Error('cannot resolve tx status list');

		const txList = BlockHelper.transactionList(block);
		const txEventList = [];

		for (let i = 0; i < txList.length; i++) {

			const tx = txList[i], status = statusList[i];

			const { shouldIgnore, event } = this._buildTransactionEvent(i, tx, status);
			if (shouldIgnore) {
				if (debug) log.debug('tx ignored: ' + JSON.stringify(event, null, 4));
				continue;
			}

			txEventList.push(event);
		}

		return {
			channelId,
			blockNumber,
			publishedAt: new Date(),
			receivedAt,
			transactionAmount: txEventList.length,
			transactions: txEventList
		};
	}


	async _blockEventCallback(block) {
		try {
			const log = this._logger, debug = log.isDebugEnabled();

			const blockEvent = this._parseBlockEvent(block, this.connectOptions);
			if (debug) log.debug('tx events to send: \n' + JSON.stringify(blockEvent, null, 4));

			await this.blockEventService.processBlockEvent(blockEvent);
		} catch (err) {
			this._logger.error(err);
		}
	}


	getChannel(channelId) {
		return this.fabricClient.getChannel(channelId);
	}


	async queryBlockHeight(channel) {
		const chInfo = await channel.queryInfo();
		return chInfo.height - 1;
	}


	async start() {
		const log = this._logger;

		for (let channelId in this.connectOptions.channels) {
			const ch = this.getChannel(channelId);
			const blockHeight = await this.queryBlockHeight(ch);
			log.info('channel "%s": block height=%s', channelId, blockHeight);

			const ctx = {};
			await this.tryToCatchUp(ctx, ch, blockHeight);
		}

		this.eventHub.registerBlockEvent(
			this._blockEventCallback.bind(this),
			err => this._logger.error(err)
		);
	}


	async tryToCatchUp(ctx, channel, targetHeight) {
		const log = this._logger;
		const channelId = channel._name;

		log.info('try to catch up block height, for channel id=%s, target height=%s', channelId, targetHeight);

		const heightInDB = await this.blockEventService.getBlockHeight(ctx, channelId);
		if (heightInDB >= targetHeight) {
			log.info('not found block needed to catch up');
			return;
		}

		log.info('current height in database is %s, need to catch up with distance=%s', heightInDB, (targetHeight - heightInDB));

		let amountOfCaughtUp = 0;

		for (let blockNumber = heightInDB + 1; blockNumber <= targetHeight; blockNumber++) {
			const ok = await this.syncWithBlock(channel, blockNumber);
			if (!ok) {
				log.error('cannot get block: ' + blockNumber);
				continue;
			}

			amountOfCaughtUp++;
		}

		log.info('%s block caught up', amountOfCaughtUp);

	}


	async syncWithBlock(channel, blockNumber) {
		const block = await this._queryBlock(channel, blockNumber);
		if (!block) return false;

		await this._blockEventCallback(block);
		return true;
	}


	async _queryBlock(channel, blockNumber) {
		const log = this._logger;
		const channelId = channel._name;

		log.info('query block for channel=%s, blockNumber=%s', channelId, blockNumber);

		for (let peerName in this.connectOptions.peers) {
			//const peer = connectOptions.peers[peerName];
			//ch.addPeer(r.newPeer(peer.url));

			log.info('query block on peer %s', peerName);

			try {
				const block = await channel.queryBlock(blockNumber, peerName);
				log.info('found block on peer %s', peerName);
				return block;
			} catch (err) {
				log.warn(err);
			}
		}

		return null;
	}


};
