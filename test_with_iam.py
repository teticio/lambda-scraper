import sys

import boto3
import requests
from requests_aws4auth import AWS4Auth

session = boto3.Session()
aws_auth = AWS4Auth(
    region=session.region_name,
    service="lambda",
    refreshable_credentials=session.get_credentials(),
)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 test_with_iam.py <lambda_proxy_url>")
        sys.exit(1)
    lambda_function_url = sys.argv[1]
    response = requests.get(lambda_function_url + "ipinfo.io/ip", auth=aws_auth)
    print(response.text)
