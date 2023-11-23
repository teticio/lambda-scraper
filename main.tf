module "lambda_proxy_i" {
  source         = "terraform-aws-modules/lambda/aws"
  count          = var.num_proxies
  function_name  = "proxy-${count.index}"
  create_package = false
  image_uri      = module.ecr_proxy_i.image_uri
  package_type   = "Image"
  timeout        = 600
  publish        = true
}

data "template_file" "proxy_urls" {
  template = file("${path.module}/lambda/proxy-urls.tftpl")

  vars = {
    PROXY_URLS = join("\n", aws_lambda_function_url.lambda_proxy_i[*].function_url)
  }
}

resource "local_file" "proxy_urls" {
  content  = data.template_file.proxy_urls.rendered
  filename = "${path.module}/lambda/proxy-urls.js"
}

module "lambda_proxy" {
  source             = "terraform-aws-modules/lambda/aws"
  function_name      = "proxy"
  create_package     = false
  image_uri          = module.ecr_proxy.image_uri
  package_type       = "Image"
  timeout            = 600
  publish            = true
  attach_policy_json = true

  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunctionUrl"
      Resource = aws_lambda_function_url.lambda_proxy_i[*].function_arn
    }]
  })
}

module "ecr_proxy_i" {
  source           = "terraform-aws-modules/lambda/aws//modules/docker-build"
  create_ecr_repo  = true
  ecr_repo         = "lambda-proxy-i"
  source_path      = "${path.module}/lambda"
  docker_file_path = "Dockerfile-i"
  platform         = "linux/amd64"

  image_tag = sha1(join("", [
    filesha1("${path.module}/lambda/package.json"),
    filesha1("${path.module}/lambda/proxy-i.js"),
    filesha1("${path.module}/lambda/Dockerfile-i"),
  ]))

  ecr_repo_lifecycle_policy = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Keep only the last 1 image",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 1
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })
}

module "ecr_proxy" {
  source           = "terraform-aws-modules/lambda/aws//modules/docker-build"
  create_ecr_repo  = true
  ecr_repo         = "lambda-proxy"
  source_path      = "${path.module}/lambda"
  docker_file_path = "Dockerfile"
  platform         = "linux/amd64"
  depends_on       = [local_file.proxy_urls]

  image_tag = sha1(join("", [
    filesha1("${path.module}/lambda/package.json"),
    filesha1("${path.module}/lambda/proxy.js"),
    fileexists("${path.module}/lambda/proxy-urls.js") ? filesha1("${path.module}/lambda/proxy-urls.js") : "",
    filesha1("${path.module}/lambda/Dockerfile"),
  ]))

  ecr_repo_lifecycle_policy = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Keep only the last 1 image",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 1
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })
}

resource "aws_lambda_function_url" "lambda_proxy_i" {
  count              = var.num_proxies
  function_name      = module.lambda_proxy_i[count.index].lambda_function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "RESPONSE_STREAM"
}

resource "aws_lambda_function_url" "lambda_proxy" {
  function_name      = module.lambda_proxy.lambda_function_name
  authorization_type = "NONE"
  invoke_mode        = "RESPONSE_STREAM"
}
