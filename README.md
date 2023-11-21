# Lambda Scraper

(See also [lambda-selenium](https://github.com/teticio/lambda-selenium))

Use AWS Lambda functions as a HTTPS proxy. This is a cost effective way to have access to a large pool of IP addresses. Run the following to create as many Lambda functions as you need (one for each IP address). The number of functions as well as the region can be specified in `variables.tf`. Each Lambda function changes IP address after approximately 6 minutes of inactivity. For example, you could create 360 Lambda functions which you cycle through one per second, while making as many requests as possible via each corresponding IP address. Note that, in practice, AWS will sometimes assign the same IP address to more than one Lambda function.

I have re-written this using Node.js to take advantage of streaming Lambda URLs, so that you can make (asynchronous) proxy requests by simply pre-pending the proxy URL. If you are looking for the original Python version, it is available in the [`old`](old) directory.

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

You can specify an `AWS_PROFILE` and `AWS_REGION` with

```bash
terraform apply -auto-approve -var 'region=AWS_REGION' -var 'profile=AWS_PROFILE'
```

The `proxy` Lambda function forwards the requests to a random `proxy-<i>` Lambda function. To obtain its URL, run

```bash
echo $(terraform output -json | jq -r '.lambda_proxy_url.value')
```

For example, if you make a number of cURL requests to this URL with `ipinfo.io/ip` appended, you should see several different IP addresses. A script that does exactly this is provided in `test.sh`.

## Authentication

Currently, the `proxy` Lambda function URL is configured to be publicly accessible, although the hash in the URL serves as a "key". The underlying `proxy-<i>` Lambda function URLs can only be accessed by signing the request with the appropriate AWS credentials. If you prefer to cycle through the underlying proxy URLs explicitly and avoid going through two Lambda functions per request, examples of how to sign the request are provided in the `proxy.js` and `test_with_iam.py`.

```bash
pip install -r requirements.txt
python test_with_iam.py <lambda_proxy_url>
```

If you decide to also enforce IAM authentication for the `proxy` Lambda function URL, it is a simple matter of changing the `authorization_type` to `AWS_IAM` in `main.tf`.
