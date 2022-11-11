# lambda-scraper

Use AWS Lambda functions as a proxy to GET web pages. This is a cost effective way to have access to a large pool of IP addresses. Run the following to create as many Lambda functions as you need (one for each IP address). The number of functions as well as the region can be specified in `variables.tf`. Each Lambda function changes IP address after approximately 6 minutes of inactvity. For example, you could create 360 Lambda functions which you cycle through one per second, while making as many requests as possible via each corresponding IP address. Note that, in practice, AWS will sometimes assign the same IP address to more than one Lambda function.

```
git clone https://github.com/teticio/lambda-scraper.git
cd lambda-scraper
terraform init
terraform apply -auto-approve
# run "terraform apply -destroy -auto-approve" in the same directory to tear all this down again
```
You can specify an `AWS_PROFILE` and `AWS_REGION` with
```
terraform apply -auto-approve -var 'region=AWS_REGION' -var 'profile=AWS_PROFILE'
```
An example of how to use this from Python is provided in `test_scraper.py`.
```
AWS_DEFAULT_REGION=AWS_REGION python test_scraper.py
```
