import json
import base64
import urllib3


def lambda_handler(event, context):
    http = urllib3.PoolManager()
    r = http.request('GET', event['url'])
    return {
        'isBase64Encoded': True,
        'headers': json.dumps(dict(r.headers)),
        'statusCode': r.status,
        'body': base64.b64encode(r.data).decode('utf-8')
    }
