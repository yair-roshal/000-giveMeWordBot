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
  rightWords,
  currentIndex
) {
  // const timestamp = Date.now()
  // const formattedDate = formatDate(timestamp)

  // Логируем отправленные слова
  // logSendedWords(
  //   `${randomIndex + 1}.${wordLineDictionary}  -  ${formattedDate}`
  // )

  if (response_dictionary_api && isOneWord) {
    return await prepareSingleWordMessage(
      response_dictionary_api,
      firstWord,
      isEnglishLanguage,
      randomIndex,
      dictionaryLength,
      wordLineDictionary,
      currentIndex
    )
  } else {
    return prepareMultiWordMessage(
      leftWords,
      rightWords,
      isEnglishLanguage,
      randomIndex,
      dictionaryLength,
      wordLineDictionary,
      currentIndex
    )
  }
}

async function prepareSingleWordMessage(
  response_dictionary_api,
  firstWord,
  isEnglishLanguage,
  randomIndex,
  dictionaryLength,
  wordLineDictionary,
  currentIndex
) {
  console.log("currentIndex", currentIndex);
  console.log("dictionaryLength", dictionaryLength);
  
  const responseData = response_dictionary_api.data

  const IAM_TOKEN = await getIAMToken()

  const { examples, phonetic, audio } = await processDictionaryData(
    responseData,
    IAM_TOKEN,
    firstWord
  )

  const phoneticLine = phonetic ? `${phonetic} - ` : ""
  const examplesLine = examples ? `${examples}` : ""
  const audioLine = audio ? `${audio}` : ""

  const linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstWord}`

  return formatSingleWordMessage(
    isEnglishLanguage,
    phoneticLine,
    wordLineDictionary,
    examplesLine,
    audioLine,
    firstWord,
    linkToTranslate,
    currentIndex,
    dictionaryLength
  )
}

async function getIAMToken() {
  const tokenJWT = await getTokenJWT()
  return await changeTokenToIAM({ jwt: tokenJWT })
}

async function processDictionaryData(responseData, IAM_TOKEN, firstWord) {
  let examples = await getExamples(responseData, IAM_TOKEN)
  let phonetic = getPhonetic(responseData)
  let audio = getAudio(responseData, firstWord)

  return { examples, phonetic, audio }
}

async function getExamples(responseData, IAM_TOKEN) {
  let examples = ""
  for (const meaning of responseData[0].meanings) {
    for (const definition of meaning.definitions) {
      if (definition.example) {
        examples += `\r\n<b>- ${definition.example}</b>`
        try {
          const translatedText = await translateText(
            definition.example,
            IAM_TOKEN
          )
          examples += `\r\n- ${translatedText}\r\n`
        } catch (err) {
          console.log("err_translateText() : ", err)
        }
      }
    }
  }
  return examples
}

function getPhonetic(responseData) {
  for (const phonetic of responseData[0].phonetics) {
    if (phonetic.text) {
      return phonetic.text
    }
  }
  return ""
}

function getAudio(responseData, firstWord) {
  for (const phonetic of responseData[0].phonetics) {
    if (phonetic.audio) {
      return phonetic.audio
    }
  }
  return `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${urlencode(
    firstWord
  )}&tl=en&client=tw-ob`
}

function formatSingleWordMessage(
  isEnglishLanguage,
  phoneticLine,
  wordLineDictionary,
  examplesLine,
  audioLine,
  firstWord,
  linkToTranslate,
  currentIndex,
  dictionaryLength
) {
  console.log("currentIndex", currentIndex);
  console.log("dictionaryLength", dictionaryLength);
  
  const videoClipsLinks = isEnglishLanguage
    ? `
    https://youglish.com/pronounce/${firstWord}/english/us

    https://www.playphrase.me/search/${firstWord}/
    
    https://yarn.co/yarn-find?text=${firstWord}
    
  `
    : ""

  return `<b>${isEnglishLanguage ? "(en)" : "(he)"}   ${rightWords}</b>
  
<b>${phoneticLine}${wordLineDictionary} </b>

${examplesLine}

<a href="${audioLine}">   </a>

<b>Video clips :</b>
<b>${videoClipsLinks}</b>

<a href="${linkToTranslate}">Translate with Context</a>
_

  <b>
    ${currentIndex + 1}/(${dictionaryLength})
  </b>
`
}

function prepareMultiWordMessage(
  leftWords,
  rightWords,
  isEnglishLanguage,
  randomIndex,
  dictionaryLength,
  wordLineDictionary,
  currentIndex
) {
  console.log("currentIndex", currentIndex);
  console.log("dictionaryLength", dictionaryLength);
  
  const linkToTranslate = `https://translate.google.com/?hl=${
    isEnglishLanguage ? "en" : "ru"
  }&sl=auto&tl=ru&text=${urlencode(leftWords)}&op=translate`

  return `<b>${isEnglishLanguage ? "(en)" : "(he)"} : ${rightWords}</b>
  
<b>${wordLineDictionary}</b>

<a href="${linkToTranslate}">Translate with Google</a>

  <b>
    ${currentIndex + 1}/(${dictionaryLength})
  </b>
`
}
