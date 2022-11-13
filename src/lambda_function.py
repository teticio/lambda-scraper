from base64 import b64encode

from requests_html import HTMLSession


def lambda_handler(event, context):
    session = HTMLSession()
    response = session.request('GET',
                               url=event['url'],
                               headers=event.get('headers', None),
                               stream=True)
    return {
        'headers': dict(response.headers),
        'statusCode': response.status_code,
        'body': b64encode(response.raw.read(decode_content=True)),
        'isBase64Encoded': True
    }
