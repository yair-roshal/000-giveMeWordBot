const dotenv = require('dotenv')
dotenv.config()
const TelegramBot = require('node-telegram-bot-api')
const token =
    process.env.NODE_ENV === 'prod'
        ? process.env.TELEGRAM_BOT_TOKEN
        : process.env.TELEGRAM_BOT_TOKEN_testing

const bot = new TelegramBot(token, { polling: true })
const getAllWordsFromFiles = require('./utils/getAllWordsFromFiles.js')
const { dictionaryText } = getAllWordsFromFiles()
const CHAT_ID_ADMIN = process.env.CHAT_ID_ADMIN
const { sec, ms, min, interval } = require('./constants/intervals.js')
const { textMessageHtml } = require('./constants/texts.js')
const sendingWordMessage = require('./utils/sendingWordMessage.js')
const dictionaryTextToFile = require('./utils/dictionaryTextToFile.js')
const {
    // startMenu,
    // mainMenu,
    start_keyboard,
    start_inline_keyboard,
    keyboard,
} = require('./constants/menus.js')

//caching dictionaries======
dictionaryTextToFile()
// logSessions()

var optionsMessage = {
    // keyboard=====
    // reply_markup: JSON.stringify(start_keyboard),
    parse_mode: 'HTML',
    //disable because we don't want show description links
    disable_web_page_preview: true,
}
// 1 message!!!!!!
bot.sendMessage(CHAT_ID_ADMIN, textMessageHtml, optionsMessage)

let dictionary
if (dictionaryText) {
    dictionary = dictionaryText.split(/\r?\n/).filter(Boolean)
}

// callback_query ===============================================
bot.on('callback_query', (query) => {
    const chatId = query.from.id
    console.log('query ---------------:>> ', query)

    if (query.data === 'give_me') {
        sendingWordMessage(dictionary, bot, chatId)
    }
})

// start ===============================================
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    var photoPath = __dirname + '/media/logo.jpg'
    // console.log('photoPath :>> ', photoPath)

    await bot.sendPhoto(chatId, photoPath, {
        caption: `Catch the first word, the rest will be in ${min} minutes`,
    })

    sendingWordMessage(dictionary, bot, chatId)
    setInterval(() => sendingWordMessage(dictionary, bot, chatId), interval) //  start function by interval
})

// sending a list of words and adding them to the dictionary ===============

// bot.on('message', (msg) => {
//     console.log('msg.text===', msg.text)
//     const chatId = msg.chat.id

//     bot.sendMessage(
//         chatId,
//         'Hello, ' +
//             msg.chat.first_name +
//             '! Please choose what you want from menu',
//         start_inline_keyboard,
//     )

//     // else if (!dictionary.includes(msg.text) && msg.text !== '/start') {
//     //     dictionary = dictionary.concat(msg.text.split(/\r?\n/))
//     //     bot.sendMessage(
//     //         chatId,
//     //         `Successfully added "${msg.text}" to the dictionary.`,
//     //     )
//     // }
// })

//===============

console.log('server started with interval:', interval / ms / sec, 'min')

// {
//     process.env.NODE_ENV === 'dev' &&
//         sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN) &&
//         setInterval(
//             () => sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN),
//             interval,
//         )
// }
