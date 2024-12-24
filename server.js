const dotenv = require("dotenv")
dotenv.config()
const TelegramBot = require("node-telegram-bot-api")
const { clockStart, clockEnd } = require("./constants/intervals.js")
// const getAllWordsFromFiles = require("./utils/getAllWordsFromFiles.js")
// const { dictionaryText } = getAllWordsFromFiles()
const { sec, ms, min, interval } = require("./constants/intervals.js")
const { textMessageHtml } = require("./constants/texts.js")
const sendingWordMessage = require("./utils/prepareMessage.js")
const dictionaryTextToFile = require("./utils/dictionaryTextToFile.js")
const { give_me_keyboard } = require("./constants/menus.js")
const getWordsFromGoogleDocs = require("./utils/getWordsFromGoogleDocs.js")

   // const token =
  //     process.env.NODE_ENV === 'prod'
  //         ? process.env.TELEGRAM_BOT_TOKEN
  //         : process.env.TELEGRAM_BOT_TOKEN_testing

  const token = process.env.TELEGRAM_BOT_TOKEN
  console.log("token :>> ", token)
  const bot = new TelegramBot(token, { polling: true })

  //caching dictionaries======
  // dictionaryTextToFile()
  // logSessions()

  var optionsMessage = {
    // keyboard=====
    // reply_markup: JSON.stringify(start_keyboard),
    parse_mode: "HTML",
    //disable because we don't want show description links
    disable_web_page_preview: true,
  }
 
  const CHAT_ID_ADMIN = process.env.CHAT_ID_ADMIN
  bot.sendMessage(CHAT_ID_ADMIN, textMessageHtml, optionsMessage)




  // start ===============================================
  bot.onText(/\/start/, async (msg) => {
    
    
    const dictionaryText = await getWordsFromGoogleDocs()
    console.log("dictionaryText", dictionaryText)
  
    let dictionary
    if (dictionaryText) {
      dictionary = dictionaryText.split(/\r?\n/).filter(Boolean)
    }
    
    const chatId = msg.chat.id
    var photoPath = __dirname + "/media/logo.jpg"
    // console.log('photoPath :>> ', photoPath)

    var optionsMessage = {
      caption: `Catch the first word, the rest will be in ${min} minutes`,
      reply_markup: JSON.stringify(give_me_keyboard),
    }

    await bot.sendPhoto(chatId, photoPath, optionsMessage)

    sendingWordMessage(dictionary, bot, chatId)

    setInterval(
      () => {
        let isTimeForSending = false

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

        isTimeForSending && sendingWordMessage(dictionary, bot, chatId)
      },

      interval
    )
  })
  
  
  // callback_query при нажатии кнопке новых слов ==========================================
  bot.on("callback_query", (query) => {
    const chatId = query.from.id
    // console.log('query ---------------:>> ', query)

    if (query.data === "give_me") {
      sendingWordMessage(dictionary, bot, chatId)
    }
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

  console.log("server started with interval:", interval / ms / sec, "min")

  // {
  //     process.env.NODE_ENV === 'dev' &&
  //         sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN) &&
  //         setInterval(
  //             () => sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN),
  //             interval,
  //         )
  // }
 
