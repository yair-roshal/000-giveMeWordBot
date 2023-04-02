const dotenv = require('dotenv')
dotenv.config()

const jose = require('node-jose')
console.log('process.env :>> ', process.env)
const private_key = process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
const serviceAccountId = process.env.SERVICE_ACCOUNT_ID
const keyId = process.env.KEY_ID
const now = Math.floor(new Date().getTime() / 1000)

module.exports = async function getTokenJWT() {
    const payload = {
        aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        iss: serviceAccountId,
        iat: now,
        exp: now + 3600,
    }

    const key = await jose.JWK.asKey(private_key, 'pem', {
        kid: keyId,
        alg: 'PS256',
    })
    const token = await jose.JWS.createSign({ format: 'compact' }, key)
        .update(JSON.stringify(payload))
        .final()

    return token
}
