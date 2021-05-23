import json
import boto3

num_proxies = 10
url = 'https://ipinfo.io/ip'

lambda_client = boto3.client('lambda')
round_robin = 0
while True:
    response = json.loads(
        lambda_client.invoke(FunctionName=f'proxy-{round_robin}',
                             InvocationType='RequestResponse',
                             Payload=json.dumps({"url":
                                                 url}))['Payload'].read())
    print(f'{response["statusCode"]} {response["body"]}')
    round_robin = (round_robin + 1) % num_proxies
