#!/usr/bin/env bash
function_url=$(terraform output -json | jq -r '.lambda_proxy_url.value.function_url')
echo $function_url
while true; do
    curl "${function_url}ipinfo.io/ip"
    echo ""
done
