import json
from requests_html import HTMLSession


def lambda_handler(event, context):
    session = HTMLSession()
    r = session.request(method='GET',
                        url=event['url'],
                        headers=event.get('headers', None))
    return {
        'isBase64Encoded': True,
        'headers': json.dumps(dict(r.headers)),
        'statusCode': r.status_code,
        'body': r.text
    }
