require("dotenv").config();

(async () => {
  const mockttp = require("mockttp");

  const server = mockttp.getLocal({
    https: {
      keyPath: "testCA.key",
      certPath: "testCA.pem",
    },
  });

  server.forAnyRequest().thenPassThrough({
    beforeRequest: req => {
      const url = new URL(req.url);
      console.log(url.toString());
      url.pathname = url.host + url.pathname;
      url.host = process.env.PROXY_HOST;
      const headers = req.headers;
      headers.host = url.host;
      return {
        ...req,
        headers: headers,
        url: url.toString(),
      };
    },
  });

  await server.start(8080);
  console.log(`Server running on port ${server.port}`);
  console.log(`Proxying to ${process.env.PROXY_HOST}`);
})();
