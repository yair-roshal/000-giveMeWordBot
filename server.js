const dotenv = require('dotenv')
dotenv.config()

const TelegramBot = require('node-telegram-bot-api')
// const token = process.env.TELEGRAM_BOT_TOKEN

const token =
    process.env.NODE_ENV === 'prod'
        ? process.env.TELEGRAM_BOT_TOKEN
        : process.env.TELEGRAM_BOT_TOKEN_testing

const bot = new TelegramBot(token, { polling: true })
// const chatIdAdmin = process.env.CHAT_ID_ADMIN

// const dictionaryText = require('./data/dictionaryText.js')
const dictionaryTextFromFile = require('./utils/dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()

const startMenu = require('./constants/menues.js')
const mainMenu = require('./constants/menues.js')

const { sec, ms, interval } = require('./constants/interval.js')
var _ = require('lodash')
const sendingMessage = require('./utils/sendingMessage.js')
const logSessions = require('./utils/logSessions.js')

const dictionaryTextToFile = require('./utils/dictionaryTextToFile.js')

//caching allWords.txt
dictionaryTextToFile()
logSessions()

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
    const chatId = msg.chat.id

    console.log('msg.text===', msg.text)
    if (msg.text == '/start') {
        bot.sendMessage(chatId, `Server-Bot successfully started  `)
    } else if (!dictionary.includes(msg.text) && msg.text !== '/start') {
        dictionary = dictionary.concat(msg.text.split(/\r?\n/))
        bot.sendMessage(
            chatId,
            `Successfully added "${msg.text}" to the dictionary.`,
        )
    }
})

console.log('server started with interval:', interval / ms / sec, 'min')

sendingMessage(dictionary, bot) //first run at the start of the server

setInterval(() => sendingMessage(dictionary, bot), interval) //  start function by interval
