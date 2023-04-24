const dotenv = require('dotenv')
dotenv.config()

const TelegramBot = require('node-telegram-bot-api')

const token =
    process.env.NODE_ENV === 'prod'
        ? process.env.TELEGRAM_BOT_TOKEN
        : process.env.TELEGRAM_BOT_TOKEN_testing

const bot = new TelegramBot(token, { polling: true })

const dictionaryTextFromFile = require('./utils/getAllWordsFromFiles.js')
const dictionaryText = dictionaryTextFromFile()

const startMenu = require('./constants/menues.js')
const mainMenu = require('./constants/menues.js')

const { sec, ms, interval } = require('./constants/interval.js')
var _ = require('lodash')
const sendingMessage = require('./utils/sendingMessage.js')
const logSessions = require('./utils/logSessions.js')

const dictionaryTextToFile = require('./utils/dictionaryTextToFile.js')

//caching dictionaries
dictionaryTextToFile()
// logSessions()

let dictionary
if (dictionaryText) {
    dictionary = dictionaryText.split(/\r?\n/).filter(Boolean)
}

function openStartMenu(chatId) {
    bot.sendMessage(chatId, 'The keyboard is open', startMenu)
}

bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Hello, ' + msg.chat.first_name + '!', mainMenu)
    openStartMenu(chatId)
})

bot.onText(/\/keyboard/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Alternative keyboard layout', mainMenu)
})

bot.on('callback_query', (query) => {
    if (query.data === 'development') {
        bot.sendMessage(chatIdAdmin, 'development menu', mainMenu)
    }
    if (query.data === 'lifestyle') {
        bot.sendMessage(chatIdAdmin, 'lifestyle menu', mainMenu)
    }
    if (query.data === 'other') {
        bot.sendMessage(chatIdAdmin, 'other menu', mainMenu)
    }
})

// sending a list of words and adding them to the dictionary
bot.on('message', (msg) => {
    console.log('msg.text===', msg.text)
    const chatId = msg.chat.id

    if (msg.text == '/start') {
        bot.sendMessage(chatId, `Server-Bot successfully started  `)

        sendingMessage(dictionary, bot, chatId) //first run at the start of the server

        setInterval(() => sendingMessage(dictionary, bot, chatId), interval) //  start function by interval
    }
    // else if (!dictionary.includes(msg.text) && msg.text !== '/start') {
    //     dictionary = dictionary.concat(msg.text.split(/\r?\n/))
    //     bot.sendMessage(
    //         chatId,
    //         `Successfully added "${msg.text}" to the dictionary.`,
    //     )
    // }
})

console.log('server started with interval:', interval / ms / sec, 'min')
