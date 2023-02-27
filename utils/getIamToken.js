const jose = require('node-jose')
const private_key = process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
// var fs = require('fs')
// var key = fs.readFileSync(require.resolve(private_key))
const serviceAccountId = process.env.SERVICE_ACCOUNT_ID
const keyId = process.env.KEY_ID
const now = Math.floor(new Date().getTime() / 1000)
const axios = require('axios')

let IAM_TOKEN

async function changeTokenToIAM(body) {
    try {
        const result = await axios
            .post('https://iam.api.cloud.yandex.net/iam/v1/tokens', body)
            .then((response) => {
                let IAM_TOKEN = response.data.iamToken
                return IAM_TOKEN
            })
        return result
    } catch (error) {
        console.log('AXIOS ERROR_jwt: ', error.response)
    }
}

module.exports = async function getIamToken() {
    const payload = {
        aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        iss: serviceAccountId,
        iat: now,
        exp: now + 3600,
    }

    jose.JWK.asKey(private_key, 'pem', { kid: keyId, alg: 'PS256' }).then(
        function (result) {
            jose.JWS.createSign({ format: 'compact' }, result)
                .update(JSON.stringify(payload))
                .final()
                .then(function (result) {
                    const jwt_token = result
                    const body = {
                        //  includes only one of the fields `yandexPassportOauthToken`, `jwt`
                        // "yandexPassportOauthToken": process.env.OAUTH_TOKEN,
                        jwt: jwt_token,
                        // end of the list of possible fields
                    }

                    changeTokenToIAM(body).then((res) => {
                        IAM_TOKEN = res
                        return IAM_TOKEN
                    })
                })
        },
    )
    return IAM_TOKEN
}
