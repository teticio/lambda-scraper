# lambda-scraper

Uses terraform to deploy as many lambda functions as you like to act as proxies. Each lambda function may have a different IP address, and these will change periodically. You only pay for the data transfer (around $9 per 100 GB).

Run `terrafom apply` to deploy to your AWS account.

`test_scraper.py` gets the IP address of each lambda function in a round robin fashion. You can adapt it to retrieve any URL. Note that the data is base64 encoded and there is currently a limit imposed by AWS of 6 MB payload per call.