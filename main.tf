terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
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
  hash_extra    = "${count.index}"
  source_path = [
    "${path.module}/src/lambda_function.py",
    {
      pip_requirements = "${path.module}/src/requirements.txt",
    }
  ]
}
