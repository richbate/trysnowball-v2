#!/bin/bash

BUCKET_NAME=snowball-rich-2025

echo "Deploying to S3 bucket: $BUCKET_NAME"

aws s3 cp index.html s3://$BUCKET_NAME/
aws s3 cp debts.html s3://$BUCKET_NAME/
aws s3 cp about.html s3://$BUCKET_NAME/
aws s3 cp styles.css s3://$BUCKET_NAME/
aws s3 cp snowball.html s3://$BUCKET_NAME/
aws s3 cp scripts.js s3://$BUCKET_NAME/
aws s3 cp resources.html s3://$BUCKET_NAME/

# For addDebt Lambda
cd backend/addDebt
zip -r ../../addDebt.zip .
cd ../..

aws lambda update-function-code --function-name addDebt --zip-file fileb://addDebt.zip --region eu-west-2

# For listDebt Lambda
cd backend/listdebt
zip -r ../../listDebt.zip .
cd ../..

aws lambda update-function-code --function-name listDebt --zip-file fileb://listDebt.zip --region eu-west-2

echo "Done! Visit:"
echo "http://$BUCKET_NAME.s3-website.eu-west-2.amazonaws.com"