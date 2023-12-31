require('dotenv').config();
const mockttp = require("mockttp");
const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let proxyEnabled = true;

const server = mockttp.getLocal({
    https: {
        keyPath: "testCA.key",
        certPath: "testCA.pem",
    },
});

server.forAnyRequest().thenPassThrough({
    beforeRequest: req => {
        if (proxyEnabled) {
            const url = new URL(req.url);
            console.log(url.toString());
            url.pathname = url.protocol + "//" + url.host + url.pathname;
            url.host = process.env.PROXY_HOST;
            url.protocol = "https";
            const headers = req.headers;
            headers.host = url.host;
            return {
                ...req,
                headers: headers,
                url: url.toString(),
            };
        } else {
            return req;
        }
    },
});

(async () => {
    await server.start(8080);
    console.log(`Server running on port ${server.port}`);
    console.log(`Proxying to ${process.env.PROXY_HOST}`);
})();

process.stdin.on('keypress', (str, key) => {
    if (key.name === 'x') {
        proxyEnabled = !proxyEnabled;
        console.log(`Proxy is now ${proxyEnabled ? 'enabled' : 'disabled'}`);
    }
    if (key.ctrl && key.name === 'c') {
        process.exit();
    }
});
