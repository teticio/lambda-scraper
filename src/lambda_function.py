import json
import urllib3


def lambda_handler(event, context):
    http = urllib3.PoolManager()
    r = http.request('GET', event['url'])
    return {'statusCode': r.status, 'body': r.data}
