// Stub module for AWS Lambda
const { Writable } = require('stream');

function streamifyResponse(lambdaHandler) {
    return async (event, context) => {
        responseStream = Writable();
        responseStream._write = (chunk, encoding, callback) => {
            console.log(chunk.toString());
            callback();
        }
        await lambdaHandler(event, responseStream, context);
    };
}

class HttpResponseStream extends Writable {
    static from(responseStream, _metadata) {
        return responseStream;
    }
}

module.exports = {
    streamifyResponse,
    HttpResponseStream,
};
