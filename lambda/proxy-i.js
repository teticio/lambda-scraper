if (typeof (awslambda) === 'undefined') {
    // For testing
    global.awslambda = require('./awslambda');
}
const axios = require('axios');
const pipeline = require('util').promisify(require('stream').pipeline);

exports.lambdaHandler = awslambda.streamifyResponse(async (event, responseStream, context) => {
    try {
        const rawQueryString = event.headers['lambda-scraper-raw-query-string'] ? event.headers['lambda-scraper-raw-query-string'] : event.rawQueryString;
        let headers = Object.fromEntries(
            Object.entries(event.headers)
                .filter(([key]) => !key.startsWith('x-') && key.toLowerCase() !== 'host' && key !== 'lambda-scraper-raw-query-string')
                .map(([key, value]) => [key.replace(/^lambda-scraper-/, ''), value])
        );
        let url = event.rawPath.startsWith('/http') ? event.rawPath.substring(1) : 'https:/' + event.rawPath;
        if (rawQueryString) {
            url += '?' + rawQueryString;
        }
        const httpRequest = {
            method: event.requestContext.http.method,
            url: url,
            headers: headers,
            responseType: 'stream',
            timeout: 600 * 1000, // 10 minutes
        }
        if (event.body) {
            httpRequest.data = event.body;
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
        headers = Object.fromEntries(Object.entries(httpResponse.headers).map(
            ([key, value]) => key.startsWith('x-') ? ['lambda-scraper-' + key, value] : [key, value]
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
