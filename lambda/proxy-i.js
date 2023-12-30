if (typeof (awslambda) === 'undefined') {
    // For testing
    global.awslambda = require('./awslambda');
}
const axios = require('axios');
const pipeline = require('util').promisify(require('stream').pipeline);

exports.lambdaHandler = awslambda.streamifyResponse(async (event, responseStream, context) => {
    try {
        let headers = Object.fromEntries(Object.entries(event.headers).filter(
            ([key]) => !key.startsWith('x-') && key.toLowerCase() !== 'host'
        ));

        const httpRequest = {
            method: event.requestContext.http.method,
            url: event.rawPath.startsWith('/http') ? event.rawPath.substring(1) : 'https:/' + event.rawPath,
            params: event.queryStringParameters,
            data: event.body || '',
            headers: headers,
            responseType: 'stream',
            timeout: 600 * 1000, // 10 minutes
        }

        let httpResponse;
        try {
            httpResponse = await axios(httpRequest);
        } catch (error) {
            if (error.response) {
                await pipeline(
                    error.response.data,
                    awslambda.HttpResponseStream.from(responseStream, {
                        statusCode: error.response.status,
                        headers: error.response.headers,
                    }),
                );
                return;
            }
            throw error;
        }
        headers = Object.fromEntries(Object.entries(httpResponse.headers).filter(
            ([key]) => !key.startsWith('x-')
        ));

        await pipeline(
            httpResponse.data,
            awslambda.HttpResponseStream.from(responseStream, {
                statusCode: httpResponse.status,
                headers: headers,
            }),
        );

    } catch (error) {
        console.error(error);
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        responseStream.write(JSON.stringify({ message: error.message, stack: error.stack }));
        responseStream.end();
    }
});

if (require.main === module) { // For testing
    const event = {
        rawPath: '/ipinfo.io/ip',
        headers: {},
        requestContext: {
            http: {
                method: 'GET',
            }
        }
    };

    exports.lambdaHandler(event, {})
        .then()
        .catch(error => console.error(error));
}
