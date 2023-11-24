import json

import boto3
import requests
from requests_aws4auth import AWS4Auth

session = boto3.Session()
aws_auth = AWS4Auth(
    region=session.region_name,
    service="lambda",
    refreshable_credentials=session.get_credentials(),
)

proxy_urls = json.loads(open("lambda/proxy-urls.json").read())

if __name__ == "__main__":
    index = 0
    while True:
        response = requests.get(proxy_urls[index] + "ipinfo.io/ip", auth=aws_auth)
        print(response.text)
        index = (index + 1) % len(proxy_urls)
