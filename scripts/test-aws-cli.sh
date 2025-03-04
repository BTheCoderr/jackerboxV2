#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "No .env file found."
  exit 1
fi

echo "AWS Credentials Check (CLI Version):"
echo "AWS_REGION: $AWS_REGION"
echo "AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:0:4}... (masked)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "AWS CLI is not installed. Please install it first."
  echo "You can install it using: brew install awscli"
  exit 1
fi

echo -e "\nTesting AWS credentials with AWS CLI..."
echo "Running: aws s3 ls --region $AWS_REGION"

# Run AWS CLI command to list S3 buckets
aws s3 ls --region $AWS_REGION

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "\nSuccess! AWS credentials are valid."
else
  echo -e "\nError: AWS CLI command failed."
  echo "This could be due to:"
  echo "1. Invalid AWS credentials"
  echo "2. Insufficient permissions"
  echo "3. Network issues"
  echo "4. Special characters in the secret key"
  
  echo -e "\nTrying to create the bucket directly with AWS CLI..."
  aws s3 mb s3://jackerbox-images --region $AWS_REGION
  
  if [ $? -eq 0 ]; then
    echo "Successfully created bucket 'jackerbox-images'!"
    
    # Set bucket policy for public read access
    echo -e "\nSetting bucket policy for public read access..."
    POLICY='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::jackerbox-images/*"
        }
      ]
    }'
    
    echo "$POLICY" > /tmp/bucket-policy.json
    aws s3api put-bucket-policy --bucket jackerbox-images --policy file:///tmp/bucket-policy.json --region $AWS_REGION
    
    # Configure CORS
    echo -e "\nConfiguring CORS..."
    CORS='{
      "CORSRules": [
        {
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
          "AllowedOrigins": ["*"],
          "ExposeHeaders": ["ETag"],
          "MaxAgeSeconds": 3000
        }
      ]
    }'
    
    echo "$CORS" > /tmp/cors-config.json
    aws s3api put-bucket-cors --bucket jackerbox-images --cors-configuration file:///tmp/cors-config.json --region $AWS_REGION
    
    echo -e "\nBucket setup complete!"
  else
    echo "Failed to create bucket."
  fi
fi 