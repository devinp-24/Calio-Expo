// backend/routes/auth.js
const express = require("express");
const {
  cognito,
  buildSecretHash,
  COGNITO_CLIENT_ID,
} = require("../utils/cognito");
const router = express.Router();

// Sign up endpoint
router.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;
  try {
    await cognito
      .signUp({
        ClientId: COGNITO_CLIENT_ID,
        SecretHash: buildSecretHash(email),
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "preferred_username", Value: username },
        ],
      })
      .promise();

    // Optionally auto-confirm:
    // await cognito.adminConfirmSignUp({ UserPoolId: COGNITO_USER_POOL_ID, Username: email }).promise();

    res
      .status(201)
      .json({ message: "Signup successful – please confirm your email" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const authResult = await cognito
      .initiateAuth({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: buildSecretHash(email),
        },
      })
      .promise();

    const { AccessToken, IdToken, RefreshToken } =
      authResult.AuthenticationResult;
    res.json({
      accessToken: AccessToken,
      idToken: IdToken,
      refreshToken: RefreshToken,
    });
  } catch (err) {
    const status = err.code === "NotAuthorizedException" ? 401 : 400;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/auth/confirm
router.post("/confirm", async (req, res) => {
  const { email, code } = req.body;
  try {
    await cognito
      .confirmSignUp({
        ClientId: COGNITO_CLIENT_ID,
        SecretHash: buildSecretHash(email),
        Username: email,
        ConfirmationCode: code,
      })
      .promise();
    res.json({ message: "Email confirmed!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
