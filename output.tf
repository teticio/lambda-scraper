output "lambda_proxy_urls" {
  value = [for url in aws_lambda_function_url.lambda_proxy_i : url.function_url]
}

output "lambda_proxy_url" {
  value = aws_lambda_function_url.lambda_proxy.function_url
}
