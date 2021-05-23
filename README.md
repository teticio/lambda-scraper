# lambda-scraper

Use AWS Lambda functions as a proxy to GET web pages. This is a cost effective way to have access to a large pool of IP addresses. Run the following to create as many Lambda functions as you need (one for each IP address). The number of functions as well as the region can be specified in `variables.tf`. Each Lambda function chnages IP address after approximately 6 minutes of inactvity. For example, you could create 360 Lambda functions which you cycle through one per second, while making as many requests as possible via each corresponding IP address.

```
git clone https://github.com/teticio/lambda-scraper.git
cd lambda-scraper
terraform init
terraform apply -auto-approve
# run "terraform apply -destroy -auto-approve" in the same directory to tear all this down again
```
An example of how to use this from Python is provided in `test_scraper.py`.
