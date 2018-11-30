const CommonProto = require('./protos/Common').common;


function number(block) {
    return parseInt(block.header.number, 10);
}


function channelId(block) {
    const txList = block.data.data;
    const tx0 = txList[0];
    return tx0.payload.header.channel_header.channel_id;
}


function transactionList(block) {
    return block.data.data;
}


function transactionStatusList(block) {
    return block.metadata.metadata[CommonProto.BlockMetadataIndex.TRANSACTIONS_FILTER];
}


function transactionHeader(tx) {
    const txPayload = tx.payload;
    return txPayload.header.channel_header;
}


function transactionAction(tx) {
    const txPayload = tx.payload;
    return txPayload.data.actions[0];
}


function transactionInput(tx) {
    const action = transactionAction(tx);
    return action.payload.chaincode_proposal_payload.input;
}


module.exports = {

    number,
    channelId,
    transactionList,
    transactionStatusList,
    transactionHeader,
    transactionAction,
    transactionInput

};
