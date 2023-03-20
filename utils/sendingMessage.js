const axios = require('axios')
// const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_BOT_TOKEN
// const bot = new TelegramBot(token, { polling: true })
const chatIdAdmin = process.env.CHAT_ID_ADMIN
const prepareMessage = require('./prepareMessage')
const { clockStart, clockEnd } = require('../constants/interval.js')

const sendingMessage = (dictionary, bot) => {
    const randomIndexForDictionary = Math.floor(
        Math.random() * dictionary.length,
    )
    let wordLineDictionary = dictionary[randomIndexForDictionary]
    console.log('______________________________ :>> ')
    console.warn('wordLineDictionary :>> ', wordLineDictionary)
    const symbol = '-'
    let firstEnglishWord = ''
    let leftEnglishWords = ''
    let arrayEnglishWords = []

    if (wordLineDictionary.indexOf(symbol) === -1) {
        console.log(`we don't have "-" in line :>> ', we don't have - in line`)
    } else {
        leftEnglishWords = wordLineDictionary.split('-')[0].trim()
        firstEnglishWord = leftEnglishWords.split(' ')[0]
    }

    let isEnglishLanguage = false
    if (/[a-zA-Z]/.test(firstEnglishWord)) {
        isEnglishLanguage = true
    }
    // else {
    //     isEnglishLanguage = false
    // }

    let isOneWord = true
    arrayEnglishWords = leftEnglishWords.split(' ')
    console.log('arrayEnglishWords :>> ', arrayEnglishWords)
    if (arrayEnglishWords.length > 1) {
        isOneWord = false
    }

    let currentDate = new Date()
    let nowHours = currentDate.getHours()
    if (nowHours < clockEnd && nowHours > clockStart) {
        isTimeForSending = true
    } else {
        isTimeForSending = false
        console.log(
            `'it isn't time for sending messages' - ${new Date().toDateString}`,
        )
    }
    console.log(
        'isTimeForSending -  isEnglishLanguage - isOneWord :',
        isTimeForSending,
        isEnglishLanguage,
        isOneWord,
    )
    isTimeForSending &&
        isEnglishLanguage &&
        // isOneWord &&
        axios
            .get(
                'https://api.dictionaryapi.dev/api/v2/entries/en/' +
                    firstEnglishWord,
            )
            .then(function (response_dictionaryapi) {
                console.log('sendingMessage_then_dictionaryapi')
                prepareMessage(
                    response_dictionaryapi.data,
                    randomIndexForDictionary,
                    wordLineDictionary,
                    isOneWord,
                    firstEnglishWord,
                    dictionary.length,
                ).then((textMessage) => {
                    bot.sendMessage(
                        chatIdAdmin,
                        isOneWord ? textMessage : wordLineDictionary,
                        {
                            parse_mode: 'HTML',
                            disable_web_page_preview: false,
                        },
                    )

                    // return textMessage
                })
            })
            .catch(function (error) {
                console.log(
                    'error_api.dictionaryapi.dev for word : ' +
                        firstEnglishWord,
                )

                bot.sendMessage(chatIdAdmin, wordLineDictionary, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: false,
                })

                // console.log('axios_error_api.dictionaryapi ===', error)
            })
}

module.exports = sendingMessage
