import json
from base64 import b64decode

import boto3

headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "sec-ch-ua": '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
}


def get_proxy():
    num_proxies = 10
    lambda_client = boto3.client("lambda")
    round_robin = 0
    while True:
        url = yield
        response = json.loads(
            lambda_client.invoke(
                FunctionName=f"proxy-{round_robin}",
                InvocationType="RequestResponse",
                Payload=json.dumps({"method": "GET", "url": url, "headers": headers}),
            )["Payload"].read()
        )
        if "body" not in response:
            raise Exception(response)
        response["body"] = b64decode(response["body"])
        yield response
        round_robin = (round_robin + 1) % num_proxies


if __name__ == "__main__":
    proxy = get_proxy()
    while True:
        proxy.send(None)  # have to do this each time
        response = proxy.send("https://ipinfo.io/ip")
        print(f'{response["body"].decode("utf-8")}')
