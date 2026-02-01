const axios = require('axios')
// const chatIdAdmin = process.env.CHAT_ID_ADMIN
const prepareMessage = require('./sendingMessage.js')
const formatDate = require('./formatDate.js')
// const langdetect = require('langdetect')
const logAlerts = require('./logAlerts.js')

const {
  // startMenu,
  // mainMenu,
  start_inline_keyboard,
  keyboard,
  give_me_keyboard,
} = require('../constants/menus.js')

const sendingWordMessage = async (dictionary, currentIndex, bot, chatId, dictionaryName = 'Основной словарь') => {
  if (!dictionary || !dictionary[currentIndex]) {
    console.error('Invalid currentIndex: ', currentIndex);
    return { leftWords: '', currentIndex: currentIndex || 0 };
  }
  
  
  const timestamp = Date.now()
  const formattedDate = formatDate(timestamp)

  let textMessage

  const randomIndexForDictionary = Math.floor(Math.random() * dictionary?.length)
  let wordLineDictionary = dictionary[currentIndex]

  // let wordLineDictionary = dictionary[randomIndexForDictionary]
  console.log('currentIndex', currentIndex)
  console.log('wordLineDictionary :>> ', wordLineDictionary)

  let firstWord = ''
  let leftWords = ''
  let rightWords = ''
  let arrayEnglishWords = []

  const symbolsArray = ['-', '—', '–', '−']

  // Используем первый найденный разделитель
  for (const symbol of symbolsArray) {
    if (wordLineDictionary && wordLineDictionary.indexOf(symbol) !== -1) {
      leftWords = wordLineDictionary.split(symbol)[0].trim()
      rightWords = wordLineDictionary.split(symbol)[1].trim()
      firstWord = leftWords.split(' ')[0]
      break // Важно: останавливаемся на первом найденном разделителе
    }
  }

  if (leftWords == '') {
    console.error('don`t found "-" in this string :>> =====================')
    sendingWordMessage(dictionary, currentIndex + 1, bot, chatId, dictionaryName)
    return { leftWords: '', currentIndex: currentIndex + 1 }
  }

  // console.log({ leftWords })

  // Language detect=========
  let isEnglishLanguage = false
  if (/[a-zA-Z]/.test(leftWords)) {
    isEnglishLanguage = true
  }

  // const language = langdetect.detect(leftWords)
  // console.log('language===', language)

  // const languages = langdetect.detectAll(leftWords)
  // console.log("languages===",languages)

  let isOneWord = true
  arrayEnglishWords = leftWords.split(' ')
  // console.log("arrayEnglishWords :>> ", arrayEnglishWords)
  if (arrayEnglishWords.length > 1) {
    isOneWord = false
  }

  //   console.log(
  //     `
  //  isEnglishLanguage -- ${isEnglishLanguage},
  // isOneWord -- ${isOneWord}
  // `
  //   )

  let response_dictionary_api
  if (isEnglishLanguage && isOneWord) {
    response_dictionary_api = await axios
      .get('https://api.dictionaryapi.dev/api/v2/entries/en/' + firstWord)
      .then(function (response_dictionary_api) {
        return response_dictionary_api
      })
      .catch(function (err) {
        // logAlerts(err)

        console.log('error_api.dictionaryapi.dev for word : ' + firstWord)
        // console.log('axios_error_api.dictionaryapi ===', err)
      })
  }
  // console.log('response_dictionary_api :>> ', !!response_dictionary_api)

  textMessage = await prepareMessage(
    response_dictionary_api,
    randomIndexForDictionary,
    wordLineDictionary,
    isOneWord,
    firstWord,
    dictionary.length,
    isEnglishLanguage,
    leftWords,
    rightWords,
    currentIndex,
    dictionaryName,
  )
    .then((res) => {
      return res
    })
    .catch((err) => {
      console.log('prepareMessage : ', err)
    })

  textMessage += `\n🆔 User ID: <b>${chatId}</b>\n\n`

  var optionsMessage = {
    reply_markup: JSON.stringify(give_me_keyboard),
    parse_mode: 'HTML',
    // disable_web_page_preview: false,
    disable_web_page_preview: isOneWord ? false : true,
  }
  var optionsMessageWithoutPreview = {
    reply_markup: JSON.stringify(give_me_keyboard),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }

  // console.log("textMessage(prepare_was_good) :>> ", !!textMessage)

  if (!response_dictionary_api) {
    await bot.sendMessage(chatId, textMessage, optionsMessageWithoutPreview)
    return { leftWords, currentIndex }
  } else if (textMessage) {
    await bot.sendMessage(chatId, textMessage, optionsMessage)
    return { leftWords, currentIndex }
  }
  
  // Default return if no conditions are met
  return { leftWords: leftWords || '', currentIndex: currentIndex || 0 }
}

module.exports = sendingWordMessage
