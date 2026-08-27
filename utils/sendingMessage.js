const getAllWordsFromFiles = require('./getAllWordsFromFiles.js')
const { objAllDictRows } = getAllWordsFromFiles()
const logSendedWords = require('./logSendedWords.js')
const formatDate = require('./formatDate.js')
const logAlerts = require('./logAlerts.js')
const dotenv = require('dotenv')
const getMnemonic = require('./getMnemonic.js')
const { formatFrequencyLine } = require('./wordFrequency.js')

dotenv.config()
var urlencode = require('urlencode')

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
  currentIndex,
  dictionaryName = 'Основной словарь',
) {
  const mnemonic = await getMnemonic(leftWords,rightWords)

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
      currentIndex,
      mnemonic,
      rightWords,
      dictionaryName,
    )
  } else {
    return prepareMultiWordMessage(
      leftWords,
      rightWords,
      isEnglishLanguage,
      randomIndex,
      dictionaryLength,
      wordLineDictionary,
      currentIndex,
      mnemonic,
      dictionaryName,
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
  currentIndex,
  mnemonic,
  rightWords,
  dictionaryName = 'Основной словарь',
) {
  console.log('currentIndex', currentIndex)
  console.log('dictionaryLength', dictionaryLength)

  const responseData = response_dictionary_api.data

  const { phonetic, audio } = processDictionaryData(responseData, firstWord)

  const phoneticLine = phonetic ? `${phonetic} - ` : ''
  const audioLine = audio ? `${audio}` : ''

  const linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstWord}`

  return formatSingleWordMessage(
    isEnglishLanguage,
    phoneticLine,
    wordLineDictionary,
    audioLine,
    firstWord,
    linkToTranslate,
    currentIndex,
    mnemonic,
    dictionaryLength,
    rightWords,
    dictionaryName,
  )
}

function processDictionaryData(responseData, firstWord) {
  let phonetic = getPhonetic(responseData)
  let audio = getAudio(responseData, firstWord)

  return { phonetic, audio }
}

function getPhonetic(responseData) {
  for (const phonetic of responseData[0].phonetics) {
    if (phonetic.text) {
      return phonetic.text
    }
  }
  return ''
}

function getAudio(responseData, firstWord) {
  for (const phonetic of responseData[0].phonetics) {
    if (phonetic.audio) {
      return phonetic.audio
    }
  }
  return `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${urlencode(firstWord)}&tl=en&client=tw-ob`
}

function formatSingleWordMessage(
  isEnglishLanguage,
  phoneticLine,
  wordLineDictionary,
  audioLine,
  firstWord,
  linkToTranslate,
  currentIndex,
  mnemonic,
  dictionaryLength,
  rightWords,
  dictionaryName = 'Основной словарь',
) {
  console.log('currentIndex', currentIndex)
  console.log('dictionaryLength', dictionaryLength)

  // Частотность показываем только для английских слов, найденных в COCA/SUBTLEX.
  const frequencyLine = isEnglishLanguage ? formatFrequencyLine(firstWord) : ''
  const frequencyBlock = frequencyLine ? `<b>${frequencyLine}</b>\n\n` : ''

  const videoClipsLinks = isEnglishLanguage
    ? `
    https://youglish.com/pronounce/${firstWord}/english/us

    https://www.playphrase.me/search/${firstWord}/
    
    https://yarn.co/yarn-find?text=${firstWord}
    
  `
    : ''

  return `<b>${isEnglishLanguage ? '(en)' : '(he)'}   ${rightWords}</b>
  
<b><tg-spoiler>${phoneticLine}${wordLineDictionary} </tg-spoiler></b>

<a href="${audioLine}">   </a>

${frequencyBlock}<a href="${linkToTranslate}">Translate with Context</a>

<b>Video clips :</b>
<b>${videoClipsLinks}</b>

_______________________________
<b>🧠 Mnemonic:</b>
${mnemonic}
_______________________________

  <b>📚 ${dictionaryName}</b>
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
  currentIndex,
  mnemonic,
  dictionaryName = 'Основной словарь',
) {
  console.log('currentIndex', currentIndex)
  console.log('dictionaryLength', dictionaryLength)

  const linkToTranslate = `https://translate.google.com/?hl=${
    isEnglishLanguage ? 'en' : 'ru'
  }&sl=auto&tl=ru&text=${urlencode(leftWords)}&op=translate`

  return `<b>${isEnglishLanguage ? '(en)' : '(he)'} : ${rightWords}</b>
  
<b><tg-spoiler>${wordLineDictionary}</tg-spoiler></b>

<a href="${linkToTranslate}">Translate with Google</a>

_______________________________
<b>🧠 Mnemonic:</b>
${mnemonic}
_______________________________

  <b>📚 ${dictionaryName}</b>
  <b>
    ${currentIndex + 1}/(${dictionaryLength})
  </b>
`
}
