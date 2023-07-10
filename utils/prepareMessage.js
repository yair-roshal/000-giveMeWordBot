const getTokenJWT = require("./getTokenJWT")
const changeTokenToIAM = require("./changeTokenToIAM")
const translateText = require("./translateText")
const getAllWordsFromFiles = require("./getAllWordsFromFiles.js")
const { objAllDictRows } = getAllWordsFromFiles()
const logSendedWords = require("../utils/logSendedWords")
const formatDate = require("./formatDate.js")
const logAlerts = require("./logAlerts")
const dotenv = require("dotenv")
dotenv.config()
var urlencode = require("urlencode")

module.exports = async function prepareMessage(
  response_dictionary_api,
  randomIndex,
  wordLineDictionary,
  isOneWord,
  firstWord,
  dictionaryLength,
  isEnglishLanguage,
  leftWords
) {
  const timestamp = Date.now()
  const formattedDate = formatDate(timestamp)

  let errTempMessage

  let logMessage =
    `${randomIndex + 1}.${wordLineDictionary}  -  ` + formattedDate
  logSendedWords(logMessage)

  let responseData
  if (response_dictionary_api != undefined && isOneWord) {
    responseData = response_dictionary_api.data

    const tokenJWT = await getTokenJWT()
    const IAM_TOKEN = await changeTokenToIAM({
      jwt: tokenJWT,
    })

    let examples = ""
    for (const key0 in responseData[0].meanings) {
      for (const key in responseData[0].meanings[key0].definitions) {
        if (
          responseData[0].meanings[key0].definitions[key].example != undefined
        ) {
          examples +=
            "\r\n" +
            `- ${responseData[0].meanings[key0].definitions[key].example}`

          await translateText(
            responseData[0].meanings[key0].definitions[key].example,
            IAM_TOKEN
          )
            .then((translateTextVar) => {
              // console.log('translateTextVar222', translateTextVar)
              if (translateTextVar)
                examples += "\r\n" + "-" + translateTextVar + "\r\n"
            })
            .catch((err) => {
              logAlerts(err)
              errTempMessage = err
              console.log("err_translateText() : ", err)
            })
        }
      }
    }
    let phonetic = ""
    for (const key in responseData[0].phonetics) {
      if (responseData[0].phonetics[key].text != undefined) {
        phonetic = responseData[0].phonetics[key].text
      }
    }

    let audio

    for (const key in responseData[0].phonetics) {
      if (responseData[0].phonetics[key].audio != undefined) {
        audio = responseData[0].phonetics[key].audio
      }
    }

    if (!audio) {
      audio = `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${urlencode(
        firstWord
      )}&tl=en&client=tw-ob`
    }

    let phoneticLine = phonetic //pronunciation
      ? `${phonetic} - `
      : responseData[0] && responseData[0].phonetic
      ? `${responseData[0] && responseData[0].phonetic} - `
      : ""
    phoneticLine = isOneWord ? phoneticLine : ""

    let exampleLine = examples && isOneWord ? `${examples}` : ""

    let audioLine =
      audio && isOneWord && responseData[0]
        ? `${audio}`
        : responseData[0].phonetics[1] && responseData[0].phonetics[1].audio
        ? `${
            responseData[0].phonetics[1] && responseData[0].phonetics[1].audio
          }`
        : ""

    const linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstWord}`

    return `<b>_______________________________</b>
        
tokenJWT : ${tokenJWT ? tokenJWT.slice(0, 5) : "undefined--"}

IAM_TOKEN : ${IAM_TOKEN ? IAM_TOKEN.slice(0, 5) : "undefined--"}

<b> errTempMessage : ${errTempMessage}</b>

<b> errTempMessage_obj : ${JSON.stringify(errTempMessage, null, 2)}</b>

        
<b>${phoneticLine}${wordLineDictionary} </b>
${exampleLine}
<b>${randomIndex + 1}/(${dictionaryLength}) </b>

<b> Dictionaries : ${JSON.stringify(objAllDictRows, null, 2)}</b>
<a href="${audioLine}">   </a>
<a href="${linkToTranslate}">Translate with Context</a>


`
  }

  if (response_dictionary_api == undefined || !isOneWord) {
    const linkToTranslate = `https://translate.google.com/?hl=${
      isEnglishLanguage ? "en" : "ru"
    }&sl=auto&tl=ru&text=${urlencode(leftWords)}&op=translate`

    let textPart1 = `<b>_______________________________</b>
<b>${wordLineDictionary} </b>
        
<b>${randomIndex + 1}/(${dictionaryLength})</b>
        
<b> Dictionaries : ${JSON.stringify(objAllDictRows, null, 2)}</b>
         
`
    let textPart2_google = ` <a href="${linkToTranslate}">Translate with Google</a>

 
 
`

    let result = textPart1 + textPart2_google

    return result
  }
}
