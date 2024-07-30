const getTokenJWT = require("./getTokenJWT.js")
const changeTokenToIAM = require("./changeTokenToIAM.js")
const translateText = require("./translateText.js")
const getAllWordsFromFiles = require("./getAllWordsFromFiles.js")
const { objAllDictRows } = getAllWordsFromFiles()
const logSendedWords = require("./logSendedWords.js")
const formatDate = require("./formatDate.js")
const logAlerts = require("./logAlerts.js")
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
  leftWords,
  rightWords
) {
  const timestamp = Date.now()
  const formattedDate = formatDate(timestamp)

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
            `<b>- ${responseData[0].meanings[key0].definitions[key].example}</b>`

          await translateText(
            responseData[0].meanings[key0].definitions[key].example,
            IAM_TOKEN
          )
            .then((translateTextVar) => {
              // console.log('translateTextVar222', translateTextVar)
              if (translateTextVar)
                examples += "\r\n" + "- " + translateTextVar + "\r\n"
            })
            .catch((err) => {
              // logAlerts(err)
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

    let examplesLine = examples && isOneWord ? `${examples}` : ""

    let audioLine =
      audio && isOneWord && responseData[0]
        ? `${audio}`
        : responseData[0].phonetics[1] && responseData[0].phonetics[1].audio
        ? `${
            responseData[0].phonetics[1] && responseData[0].phonetics[1].audio
          }`
        : ""

    const linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstWord}`

    // return final sms ===================================

    return `<b>${isEnglishLanguage == true ? "(en)" : "(he)"}   ${rightWords}</b>
<b>${phoneticLine}${wordLineDictionary} </b>
${examplesLine}

<a href="${audioLine}">   </a>

<b>Video clips :</b>
<b>${(isEnglishLanguage == true && isOneWord) ? `
   
https://www.playphrase.me/search/${firstWord}/
   
https://yarn.co/yarn-find?text=${firstWord}
  
  
  ` : ""}  </b>

<a href="${linkToTranslate}">Translate with Context</a>

_
`
// save------------
{/* <b>${randomIndex + 1}/(${dictionaryLength}) </b> */}
{/* <b> Dictionaries : ${JSON.stringify(objAllDictRows, null, 2)}</b> */}

  }

  //if we have  a few words ======================================

  if (response_dictionary_api == undefined || !isOneWord) {
    const linkToTranslate = `https://translate.google.com/?hl=${
      isEnglishLanguage ? "en" : "ru"
    }&sl=auto&tl=ru&text=${urlencode(leftWords)}&op=translate`

    let textPart1 = `<b>${
      isEnglishLanguage == true ? "en" : "he"
    } : ${rightWords}</b>
    

<b>${wordLineDictionary} </b>
<b>${randomIndex + 1}/(${dictionaryLength})</b>
        

         
`
{/* <b> Dictionaries : ${JSON.stringify(objAllDictRows, null, 2)}</b> */}

    let textPart2_google = ` <a href="${linkToTranslate}">Translate with Google</a>

 
 
`

    return textPart1 + textPart2_google
  }
}
