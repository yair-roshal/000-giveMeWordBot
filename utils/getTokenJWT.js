const dotenv = require("dotenv")
dotenv.config()
const formatDate = require("./formatDate.js")

const jose = require("node-jose")

const serviceAccountId = process.env.SERVICE_ACCOUNT_ID
const keyId = process.env.KEY_ID
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
const now = Math.floor(new Date().getTime() / 1000)
// const now = new Date().getTime()

const getTokenJWT = async () => {
  const payload = {
    aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
    iss: serviceAccountId,
    iat: now,
    exp: now + 3500 * 1000,
  }

  const key = await jose.JWK.asKey(privateKey, "pem", {
    kid: keyId,
    alg: "PS256",
  })

  const token = await jose.JWS.createSign({ format: "compact" }, key)
    .update(JSON.stringify(payload))
    .final()

  console.log("getTokenJWT_now", formatDate(payload?.iat))
  console.log("getTokenJWT_exp", formatDate(payload?.exp))
  console.log("token", token)

  return token
}

module.exports = getTokenJWT
