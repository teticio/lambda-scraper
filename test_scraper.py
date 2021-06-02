import io
import json
import boto3
import base64


def get_proxy():
    num_proxies = 10
    lambda_client = boto3.client('lambda')
    round_robin = 0
    while True:
        url = yield
        response = json.loads(
            lambda_client.invoke(FunctionName=f'proxy-{round_robin}',
                                 InvocationType='RequestResponse',
                                 Payload=json.dumps({"url":
                                                     url}))['Payload'].read())
        yield response
        round_robin = (round_robin + 1) % num_proxies


if __name__ == '__main__':
    proxy = get_proxy()
    while True:
        proxy.send(None)  # have to do this each time
        response = proxy.send('https://ipinfo.io/ip')
        print(
            f'{response["statusCode"]} {base64.b64decode(response["body"]).decode("utf-8")}'
        )
