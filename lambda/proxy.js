if (typeof (awslambda) === 'undefined') {
    // For testing
    global.awslambda = require('./awslambda');
}
const axios = require('axios');
const pipeline = require('util').promisify(require('stream').pipeline);
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { SignatureV4 } = require("@smithy/signature-v4");
const { Sha256 } = require("@aws-crypto/sha256-js");
const proxyUrls = require('./proxy-urls.json');

exports.lambdaHandler = awslambda.streamifyResponse(async (event, responseStream, context) => {
    try {
        const random = Math.floor(Math.random() * proxyUrls.length);
        const proxyUrl = new URL(proxyUrls[random]);
        console.log('proxy-' + String(random) + ': ' + proxyUrl);
        let headers = Object.fromEntries(
            Object.entries(event.headers)
                .filter(([key]) => !key.startsWith('x-'))
                .map(([key, value]) => [key.toLowerCase() === 'authorization' ? 'lambda-scraper-' + key : key, value])
        );
        headers['host'] = proxyUrl.hostname;

        // URL encoding and decoding can be ambiguous (e.g. type=a&type=b becomes type=a,b)
        // Signing would force us the query string parameters as encoded by AWS
        // so we pass the raw query string in a header instead
        headers['lambda-scraper-raw-query-string'] = event.rawQueryString;
        const httpRequest = {
            method: event.requestContext.http.method,
            path: event.rawPath, // Needed for SignatureV4
            url: proxyUrl + event.rawPath.substring(1),
            // query: event.queryStringParameters, // Needed for SignatureV4
            // params: event.queryStringParameters,
            headers: headers,
            responseType: 'stream',
            timeout: 600 * 1000, // 10 minutes
        };
        if (event.body) {
            httpRequest.body = event.body; // Needed for SignatureV4
            httpRequest.data = event.body;
        }

        const credentials = await defaultProvider()();
        const signer = new SignatureV4({
            credentials: credentials,
            region: process.env.AWS_REGION,
            service: 'lambda',
            sha256: Sha256,
        });
        const signedRequest = await signer.sign(httpRequest);

        let httpResponse;
        try {
            httpResponse = await axios(signedRequest);
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
