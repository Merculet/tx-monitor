const BigDecimal = global.BigDecimal;

/**
 * Track the trade of a commodity from one trader to another
 * @param {org.example.mynetwork.Trade} trade - the trade to be processed
 * @transaction
 */
async function tradeCommodity(trade) {

    console.log('using BigDecimal');

    console.log('0.1+0.2=' +
        (new BigDecimal("0.1").add(new BigDecimal("0.2"))));

    console.log('(9999999999999999 === 10000000000000001):' +
        (new BigDecimal("9999999999999999") === new BigDecimal("10000000000000001")));

    console.log('9007199254740992+1=' +
        (new BigDecimal("9007199254740992").add(new BigDecimal("1"))));


    let beginTime = new Date().getTime(), endTime;

    // set the new owner of the commodity
    trade.commodity.owner = trade.newOwner;
    let assetRegistry = await getAssetRegistry('org.example.mynetwork.Commodity');

    endTime = new Date().getTime();
    console.log('time to call getAssetRegistry: ' + (endTime - beginTime) + ' ms');
    beginTime = endTime;
    console.log();

    if (trade.commodity.owner.tradeId !== 'TRADER3') {
        // emit a notification that a trade has occurred
        let tradeNotification = getFactory().newEvent('org.example.mynetwork', 'TradeNotification');
        tradeNotification.commodity = trade.commodity;
        emit(tradeNotification);

        endTime = new Date().getTime();
        console.log('time to emit event: ' + (endTime - beginTime) + ' ms');
        beginTime = endTime;
        console.log();
    }

    // persist the state of the commodity
    await assetRegistry.update(trade.commodity);

    endTime = new Date().getTime();
    console.log('time to call assetRegistry.update: ' + (endTime - beginTime) + ' ms');
    beginTime = endTime;
    console.log();
}

/**
 * Remove all high volume commodities
 * @param {org.example.mynetwork.RemoveHighQuantityCommodities} remove - the remove to be processed
 * @transaction
 */
async function removeHighQuantityCommodities(remove) {

    let assetRegistry = await getAssetRegistry('org.example.mynetwork.Commodity');
    let results = await query('selectCommoditiesWithHighQuantity');

    for (let n = 0; n < results.length; n++) {
        let trade = results[n];

        // emit a notification that a trade was removed
        let removeNotification = getFactory().newEvent('org.example.mynetwork', 'RemoveNotification');
        removeNotification.commodity = trade;
        emit(removeNotification);
        await assetRegistry.remove(trade);
    }
}

/*
tradeCommodity('')
    .then(() => {
        console.log('done');
    });
*/
