// backend/utils/cognito.js
const AWS = require("aws-sdk");
const crypto = require("crypto");
require("dotenv").config();

const {
  AWS_REGION,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
} = process.env;

AWS.config.update({ region: AWS_REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

/** Build the SECRET_HASH that USER_PASSWORD_AUTH requires */
function buildSecretHash(username) {
  return crypto
    .createHmac("SHA256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}

module.exports = {
  cognito,
  buildSecretHash,
  COGNITO_CLIENT_ID,
  COGNITO_USER_POOL_ID,
};
