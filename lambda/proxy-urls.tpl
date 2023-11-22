exports.proxyUrls = [
%{ for url in split("\n", PROXY_URLS) ~}
  "${url}",
%{ endfor ~}
];
