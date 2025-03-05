/**
 * AWS environment variables utility
 * 
 * This file provides a centralized way to access AWS environment variables,
 * supporting both standard AWS_ prefixed variables and MY_AWS_ prefixed variables
 * for compatibility with hosting platforms like Netlify that reserve AWS_ variables.
 */

export const getAwsRegion = (): string => {
  return process.env.MY_AWS_REGION || process.env.AWS_REGION || "us-east-2";
};

export const getAwsAccessKeyId = (): string => {
  return process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
};

export const getAwsSecretAccessKey = (): string => {
  return process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
};

export const getAwsS3BucketName = (): string => {
  return process.env.MY_AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "jackerbox-image";
}; 