terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  required_version = ">= 0.14.9"
}

provider "aws" {
  profile = "default"
  region  = var.region
}

module "lambda_function" {
  source        = "terraform-aws-modules/lambda/aws"
  count         = var.num_proxies
  function_name = "proxy-${count.index}"
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.8"
  source_path   = "${path.module}/src/lambda_function.py"
}
