terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }

    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

provider "aws" {
  profile = var.profile
  region  = var.region
}

data "aws_caller_identity" "this" {}

data "aws_ecr_authorization_token" "token" {}

provider "docker" {
  registry_auth {
    address  = format("%v.dkr.ecr.%v.amazonaws.com", data.aws_caller_identity.this.account_id, var.region)
    username = data.aws_ecr_authorization_token.token.user_name
    password = data.aws_ecr_authorization_token.token.password
  }
}
