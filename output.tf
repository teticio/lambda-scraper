output "lambda_proxy_urls" {
  value = aws_lambda_function_url.lambda_proxy_i[*].function_url
}

output "lambda_proxy_url" {
  value = aws_lambda_function_url.lambda_proxy.function_url
}
