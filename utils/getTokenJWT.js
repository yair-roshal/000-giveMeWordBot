const dotenv = require("dotenv")
dotenv.config()

const jose = require("node-jose")

const serviceAccountId = process.env.SERVICE_ACCOUNT_ID
const keyId = process.env.KEY_ID
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
const now = Math.floor(new Date().getTime() / 1000)
const jwtExpirationTimeout = 3600

const getTokenJWT = async () => {
  const payload = {
    aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
    iss: serviceAccountId,
    iat: now,
    exp: now + jwtExpirationTimeout,
  }

  console.log("getTokenJWT_now", payload?.iat?.toLocaleString())
  console.log("getTokenJWT_exp", payload?.exp?.toLocaleString())

  const key = await jose.JWK.asKey(privateKey, "pem", {
    kid: keyId,
    alg: "PS256",
  })

  const token = await jose.JWS.createSign({ format: "compact" }, key)
    .update(JSON.stringify(payload))
    .final()

  return token
}

module.exports = getTokenJWT
