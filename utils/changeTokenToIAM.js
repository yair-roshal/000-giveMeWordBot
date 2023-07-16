const axios = require("axios")
// const logAlerts = require("./logAlerts")

module.exports = async function changeTokenToIAM(jwtObj) {
  try {
    const result = await axios
      .post("https://iam.api.cloud.yandex.net/iam/v1/tokens", jwtObj)
      .then((response) => {
        let IAM_TOKEN = response.data.iamToken
        console.log("IAM_TOKEN==", { IAM_TOKEN })
        return IAM_TOKEN
      })
    return result
  } catch (err) {
    // logAlerts(err)
    // console.log("AXIOS ERROR _ changeTokenToIAM: ", err.response)
    console.log('jwtObj', jwtObj)
    console.log("AXIOS ERROR _ changeTokenToIAM_err.response.data: ", err.response.data)
    console.log("AXIOS ERROR _ changeTokenToIAM_err.response.data.details: ", err.response.data.details)
  }
}
