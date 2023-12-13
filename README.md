# Lambda Scraper

(See also [lambda-selenium](https://github.com/teticio/lambda-selenium))

Use AWS Lambda functions as a HTTPS proxy. This is a cost effective way to have access to a large pool of IP addresses. Run the following to create as many Lambda functions as you need (one for each IP address). The number of functions as well as the region can be specified in `variables.tf`. Each Lambda function changes IP address after approximately 6 minutes of inactivity. For example, you could create 360 Lambda functions which you cycle through one per second, while making as many requests as possible via each corresponding IP address. Note that, in practice, AWS will sometimes assign the same IP address to more than one Lambda function.

I have re-written this using Node.js to take advantage of streaming Lambda function URLs, so that you can make (asynchronous) proxy requests by simply pre-pending the proxy URL. If you are looking for the original Python version, it is available in the [`old`](old) directory.

## Pre-requisites

You will need to have installed Terraform and Docker.

## Usage

```bash
git clone https://github.com/teticio/lambda-scraper.git
cd lambda-scraper
terraform init
terraform apply -auto-approve
# run "terraform apply -destroy -auto-approve" in the same directory to tear all this down again
```

You can specify the AWS region and profile as well as the number of proxies in a `terraform.tfvars` file:

```terraform
num_proxies = 10
region      = "eu-west-2"
profile     = "default"
```

The `proxy` Lambda function forwards the requests to a random `proxy-<i>` Lambda function. To obtain its URL, run

```bash
echo $(terraform output -json | jq -r '.lambda_proxy_url.value')
```

Then you can make requests via the proxy by pre-pending the URL.

```
curl https://<hash>.lambda-url.<region>.on.aws/ipinfo.io/ip
```

If you make a number of cURL requests to this URL, you should see several different IP addresses. A script that does exactly this is provided in `test.sh`. You will notice that there is a cold start latency the first time each Lambda function is invoked.

## Authentication

Currently, the `proxy` Lambda function URL is configured to be publicly accessible, although the hash in the URL serves as a "key". The underlying `proxy-<i>` Lambda function URLs can only be accessed directly by signing the request with the appropriate AWS credentials. If you prefer to cycle through the underlying proxy URLs explicitly and avoid going through two Lambda functions per request, examples of how to sign the request are provided in `proxy.js` and `test_with_iam.py`. The list of underlying proxy URLs created by Terraform can be found in `lambda/proxy-urls.json`.

```bash
pip install -r requirements.txt
python test_with_iam.py
```

If you decide to also enforce IAM authentication for the `proxy` Lambda function URL, it is a simple matter of changing the `authorization_type` to `AWS_IAM` in `main.tf`.

## Concurrency

The ability to call the Lambda functions asynchronously makes numerous parallel requests possible without resorting to multi-threading, while the proxy avoids being rate limited. In Python you can use the `aiohttp` library to make asynchronous HTTP requests as follows:

```python
import asyncio

import aiohttp

# Replace with your proxy URL
PROXY = "https://<hash>.lambda-url.<region>.on.aws/"


async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()


async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url.replace("https://", PROXY)) for url in urls]
        htmls = await asyncio.gather(*tasks)
    return htmls


urls = [
    "https://www.bbc.co.uk/news",
    "https://www.bbc.co.uk/news/uk",
]
print(asyncio.run(fetch_all(urls)))
```
