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
  source               = "github.com/raymondbutcher/terraform-aws-lambda-builder"
  count                = var.num_proxies
  function_name        = "proxy-${count.index}"
  handler              = "lambda_function.lambda_handler"
  runtime              = "python3.8"
  timeout              = 30
  build_mode           = "FILENAME"
  filename             = "lambda_function.py"
  source_dir           = "${path.module}/src"
}
