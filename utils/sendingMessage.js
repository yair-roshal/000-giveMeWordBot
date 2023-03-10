const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })
const chatIdAdmin = process.env.CHAT_ID_ADMIN
const prepareMessage = require('./prepareMessage')
const { clockStart, clockEnd } = require('../constants/interval.js')

const sendingMessage = (dictionary) => {
    const randomIndex = Math.floor(Math.random() * dictionary.length)
    let wordLineDictionary = dictionary[randomIndex]
    const leftEnglishWords = wordLineDictionary.split('-')[0].trim()
    console.log('sendingMessage________________________')
    firstEnglishWord = leftEnglishWords.split(' ')[0]

    let isEnglishLanguage
    if (/[a-zA-Z]/.test(firstEnglishWord)) {
        // only english char
        isEnglishLanguage = true
    } else {
        // not only english char
        isEnglishLanguage = false
    }

    let isOneWord = true
    if (leftEnglishWords.split(' ').length > 1) {
        isOneWord = false
    }

    let currentDate = new Date()
    let nowHours = currentDate.getHours()
    if (nowHours < clockEnd && nowHours > clockStart) {
        isTimeForSending = true
    } else {
        isTimeForSending = false
        console.log(`'it isn't time for sending messages' - ${new Date().toDateString}`)
    }

    isTimeForSending &&
        isEnglishLanguage &&
        isOneWord &&
        axios
            .get(
                'https://api.dictionaryapi.dev/api/v2/entries/en/' +
                    firstEnglishWord,
            )
            .then(function (response) {
                prepareMessage(
                    response.data,
                    randomIndex,
                    wordLineDictionary,
                    isOneWord,
                    firstEnglishWord,
                    dictionary.length,
                ).then((textMessage) => {
                    bot.sendMessage(chatIdAdmin, textMessage, {
                        parse_mode: 'HTML',
                        disable_web_page_preview: false,
                    })
                })
            })
            .catch(function (error) {
                console.log(
                    'error_api.dictionaryapi.dev for word : ' +
                        firstEnglishWord,
                )
                // console.log('axios_error_api.dictionaryapi ===', error)
            })
}

console.log(module)

// module.exports = [  sendingMessage ,prepareMessage ]
// module.exports = {  sendingMessage }
module.exports = sendingMessage

console.log(module)
