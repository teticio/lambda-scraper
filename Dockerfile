FROM public.ecr.aws/lambda/python:3.11
COPY requirements.txt /var/task
COPY lambda_function.py /var/task
RUN pip install -r requirements.txt
CMD [ "lambda_function.lambda_handler" ]
