export const AWS_CONFIG = {
  region: process.env.AWS_REGION || "ap-south-1",
  dynamoDb: {
    usersTable: process.env.DYNAMODB_TABLE_USERS || "voltloop-users-dev",
    chargersTable: process.env.DYNAMODB_TABLE_CHARGERS || "voltloop-chargers-dev",
    bookingsTable: process.env.DYNAMODB_TABLE_BOOKINGS || "voltloop-bookings-dev",
    reviewsTable: process.env.DYNAMODB_TABLE_REVIEWS || "voltloop-reviews-dev",
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || "voltloop-media-dev",
  },
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || "",
    clientId: process.env.COGNITO_CLIENT_ID || "",
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0",
  },
  isAwsConfigured: Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  ),
};
