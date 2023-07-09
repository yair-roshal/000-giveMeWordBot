const jose = require("node-jose")
const private_key = process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
// var fs = require('fs')
// var key = fs.readFileSync(require.resolve(private_key))
const serviceAccountId = process.env.SERVICE_ACCOUNT_ID
const keyId = process.env.KEY_ID
const now = Math.floor(new Date().getTime() / 1000)
const axios = require("axios")
const logAlerts = require("./logAlerts")

module.exports = async function changeTokenToIAM(jwtObj) {
  try {
    const result = await axios
      .post("https://iam.api.cloud.yandex.net/iam/v1/tokens", jwtObj)
      .then((response) => {
        let IAM_TOKEN = response.data.iamToken
        // console.log('IAM_TOKEN==', { IAM_TOKEN })
        return IAM_TOKEN
      })
    return result
  } catch (err) {
    logAlerts(err)
    console.log("AXIOS ERROR _ changeTokenToIAM: ", err.response)
  }
}
