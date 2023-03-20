const axios = require('axios')
// const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_BOT_TOKEN
// const bot = new TelegramBot(token, { polling: true })
const chatIdAdmin = process.env.CHAT_ID_ADMIN
const prepareMessage = require('./prepareMessage')
const { clockStart, clockEnd } = require('../constants/interval.js')
const formatDate = require('./formatDate.js')

const sendingMessage = async (dictionary, bot) => {
    const timestamp = Date.now()
    const formattedDate = formatDate(timestamp)

    let textMessage
    let isTimeForSending = false

    const randomIndexForDictionary = Math.floor(
        Math.random() * dictionary.length,
    )
    let wordLineDictionary = dictionary[randomIndexForDictionary]
    console.log('______________________________ :>> ')
    console.warn(
        'wordLineDictionary :>> ',
        wordLineDictionary,
        '  ',
        formattedDate,
    )

    let firstEnglishWord = ''
    let leftEnglishWords = ''
    let arrayEnglishWords = []

    const symbolsArray = ['-', '—', '&shy;']

    symbolsArray.forEach((symbol) => {
        if (wordLineDictionary.indexOf(symbol) !== -1) {
            leftEnglishWords = wordLineDictionary.split(symbol)[0].trim()
            firstEnglishWord = leftEnglishWords.split(' ')[0]
            return
        }
    })

    console.log(
        'leftEnglishWords,firstEnglishWord :>> ',
        leftEnglishWords,
        firstEnglishWord,
    )

    let isEnglishLanguage = false
    if (/[a-zA-Z]/.test(firstEnglishWord)) {
        isEnglishLanguage = true
    }

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

    let response_dictionaryapi
    if (isTimeForSending && isEnglishLanguage) {
        response_dictionaryapi = await axios
            .get(
                'https://api.dictionaryapi.dev/api/v2/entries/en/' +
                    firstEnglishWord,
            )
            .then(function (response_dictionaryapi) {
                return response_dictionaryapi
            })
            .catch(function (error) {
                console.log(
                    'error_api.dictionaryapi.dev for word : ' +
                        firstEnglishWord,
                )
                // console.log('axios_error_api.dictionaryapi ===', error)
            })
    }
    console.log('response_dictionaryapi :>> ', !!response_dictionaryapi)

    textMessage = await prepareMessage(
        response_dictionaryapi,
        randomIndexForDictionary,
        wordLineDictionary,
        isOneWord,
        firstEnglishWord,
        dictionary.length,
    ).then((res) => {
        return res
    })

    console.log('isTimeForSending :>> ', isTimeForSending)
    console.log('textMessage :>> ', !!textMessage)
    textMessage &&
        isTimeForSending &&
        bot.sendMessage(chatIdAdmin, textMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: false,
        })
}

module.exports = sendingMessage
