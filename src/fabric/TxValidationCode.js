const TransactionProto = require('./protos/Transaction').protos;


const CODES = {};

const keys = Object.keys(TransactionProto.TxValidationCode);
for (let key of keys) {
    let newKey = TransactionProto.TxValidationCode[key];
    CODES[newKey] = key;
}


module.exports = {

    CODES,

    fromTxStatus: function (status) {
        return CODES[status];
    }

};
