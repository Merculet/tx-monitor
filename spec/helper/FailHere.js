global.failhere = function(msg) {
    msg = msg || 'exception is expected to raise here';
    fail(msg);
    throw new Error(msg);
};