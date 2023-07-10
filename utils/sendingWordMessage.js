const axios = require("axios")
// const chatIdAdmin = process.env.CHAT_ID_ADMIN
const prepareMessage = require("./prepareMessage")
const { clockStart, clockEnd } = require("../constants/intervals.js")
const formatDate = require("./formatDate.js")
// const langdetect = require('langdetect')
const logAlerts = require("./logAlerts")

const {
  // startMenu,
  // mainMenu,
  start_inline_keyboard,
  keyboard,
  give_me_keyboard,
} = require("../constants/menus.js")

const sendingWordMessage = async (dictionary, bot, chatId) => {
  const timestamp = Date.now()
  const formattedDate = formatDate(timestamp)

  let textMessage
  let isTimeForSending = false

  const randomIndexForDictionary = Math.floor(Math.random() * dictionary.length)
  let wordLineDictionary = dictionary[randomIndexForDictionary]
  console.log("______________________________ :>> ")
  console.log(
    "wordLineDictionary :>> ",
    wordLineDictionary,
    "  ",
    formattedDate
  )

  let firstWord = ""
  let leftWords = ""
  let arrayEnglishWords = []

  const symbolsArray = ["-", "—", "&shy;", "-"]

  symbolsArray.forEach((symbol) => {
    if (wordLineDictionary.indexOf(symbol) !== -1) {
      leftWords = wordLineDictionary.split(symbol)[0].trim()
      firstWord = leftWords.split(" ")[0]
      return
    }
  })

  if (leftWords == "") {
    console.error('dont found "-" in this string :>> =====================')
    sendingWordMessage(dictionary, bot, chatId)
    return
  }

  console.log({ leftWords })

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
  arrayEnglishWords = leftWords.split(" ")
  console.log("arrayEnglishWords :>> ", arrayEnglishWords)
  if (arrayEnglishWords.length > 1) {
    isOneWord = false
  }

  let currentDate = new Date()
  let nowHours = currentDate.getHours()
  let nowMinutes = currentDate.getMinutes()

  if (process.env.NODE_ENV === "dev") {
    isTimeForSending = true
  } else if (nowHours < clockEnd && nowHours > clockStart) {
    isTimeForSending = true
  } else {
    console.log(
      `it isn't time for sending messages  -   ${nowHours}:${nowMinutes}`
    )
  }

  console.log(
    `

isTimeForSending -- ${isTimeForSending},
isEnglishLanguage -- ${isEnglishLanguage},
isOneWord -- ${isOneWord}

`
  )

  let response_dictionary_api
  if (isTimeForSending && isEnglishLanguage && isOneWord) {
    response_dictionary_api = await axios
      .get("https://api.dictionaryapi.dev/api/v2/entries/en/" + firstWord)
      .then(function (response_dictionary_api) {
        return response_dictionary_api
      })
      .catch(function (err) {
        logAlerts(err)

        console.log("error_api.dictionaryapi.dev for word : " + firstWord)
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
    leftWords
  )
    .then((res) => {
      return res
    })
    .catch((err) => {
      console.log("prepareMessage : ", err)
    })

  var optionsMessage = {
    reply_markup: JSON.stringify(give_me_keyboard),
    parse_mode: "HTML",
    // disable_web_page_preview: false,
    disable_web_page_preview: isOneWord ? false : true,
  }
  var optionsMessageWithoutPreview = {
    reply_markup: JSON.stringify(give_me_keyboard),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  }

  console.log("textMessage(prepare_was_good) :>> ", !!textMessage)
  console.log("isTimeForSending :>> ", !!isTimeForSending)

  if (!response_dictionary_api && isTimeForSending) {
    bot.sendMessage(chatId, textMessage, optionsMessageWithoutPreview)
  } else if (textMessage && isTimeForSending) {
    bot.sendMessage(chatId, textMessage, optionsMessage)
  }
}

module.exports = sendingWordMessage
