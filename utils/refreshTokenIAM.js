const axios = require("axios")
const logAlerts = require("./logAlerts")
const getTokenJWT = require("./getTokenJWT")
// const changeTokenToIAM = require('./changeTokenToIAM')

module.exports = async function refreshTokenIAM() {
  const tokenJWT = await getTokenJWT()
  console.log("refreshTokenIAM_tokenJWT", tokenJWT)

  let jwtObj = {
    jwt: tokenJWT,
  }

  return changeTokenToIAM(jwtObj)

  // try {
  //   const result = await axios
  //     .post("https://iam.api.cloud.yandex.net/iam/v1/tokens", jwtObj)
  //     .then((response) => {
  //       let IAM_TOKEN = response.data.iamToken
  //       console.log("IAM_TOKEN==", Boolean(IAM_TOKEN))
  //       // console.log('IAM_TOKEN==', { IAM_TOKEN })
  //       return IAM_TOKEN
  //     })
  //   return result
  // } catch (err) {
  //   // logAlerts(err)
  //   console.log("AXIOS ERROR _ refreshTokenIAM: ", err.response)
  // }
}
