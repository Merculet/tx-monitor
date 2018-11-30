
const GRPC = require('grpc');
const Path = require('path');

const FABRIC_CLIENT_ENTRY_PATH = require.resolve('fabric-client');
const FABRIC_CLIENT_PROTOS_DIR = Path.join(Path.dirname(FABRIC_CLIENT_ENTRY_PATH), 'lib', 'protos');


module.exports = {

    FABRIC_CLIENT_ENTRY_PATH,

    FABRIC_CLIENT_PROTOS_DIR,

    loadGrpcProto: function (...path) {
        return GRPC.load(Path.join.apply(null, [FABRIC_CLIENT_PROTOS_DIR].concat(path)));
    }

}
