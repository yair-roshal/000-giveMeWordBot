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

const fs = require("fs")
const path = require("path")

const pidFile = path.join(__dirname, "bot.pid")

// Проверяем, существует ли PID-файл
if (fs.existsSync(pidFile)) {
  const pid = parseInt(fs.readFileSync(pidFile, "utf8"), 10)

  try {
    // Проверяем, активен ли процесс
    process.kill(pid, 0)
    console.log(`Bot is already running with PID ${pid}. Exiting...`)
    process.exit(1) // Завершаем текущий процесс
  } catch (err) {
    // Если процесс не существует, продолжаем
    console.log(
      "Stale PID file found. Starting new bot instance...",
      new Date().toLocaleTimeString("en-GB")
    )
    fs.unlinkSync(pidFile) // Удаляем старый PID-файл
  }
}

// Записываем текущий PID в файл
fs.writeFileSync(pidFile, process.pid.toString())

// Удаляем PID-файл при завершении процесса
process.on("exit", () => fs.unlinkSync(pidFile))
process.on("SIGINT", () => {
  fs.unlinkSync(pidFile)
  process.exit(0)
})

// =================================


// const token =
//     process.env.NODE_ENV === 'prod'
//         ? process.env.TELEGRAM_BOT_TOKEN
//         : process.env.TELEGRAM_BOT_TOKEN_testing

const token = process.env.TELEGRAM_BOT_TOKEN
console.log("token :>> ", token)
console.log("process.env.NODE_ENV", process.env.NODE_ENV)
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
var dictionary

// callback_query при нажатии кнопке новых слов ==========================================
bot.on("callback_query", (query) => {
  const chatId = query.from.id
  // console.log('query ---------------:>> ', query)

  if (query.data === "give_me") {
    sendingWordMessage(dictionary, bot, chatId)
  }
})

bot.on("polling_error", console.log)

// start ===============================================
bot.onText(/\/start/, async (msg) => {
  const dictionaryText = await getWordsFromGoogleDocs()
  // console.log("dictionaryText", dictionaryText)

  if (dictionaryText) {
    dictionary = dictionaryText.split(/\r?\n/).filter(Boolean)
  }

  // console.log("dictionary", dictionary)
  const chatId = msg.chat.id
  var photoPath = __dirname + "/media/logo.jpg"
  // console.log('photoPath :>> ', photoPath)

  var optionsMessage = {
    caption: `Catch the first word, the rest will be in ${min} minutes`,
    reply_markup: JSON.stringify(give_me_keyboard),
  }

  await bot.sendPhoto(chatId, photoPath, optionsMessage)

  sendingWordMessage(dictionary, bot, chatId)

  
  
  
  
  
  
  
  
  let previousDictionaryHash = null; // Для проверки изменений в словаре

// Функция для хеширования словаря (для проверки изменений)
const hashDictionary = (dictionary) => {
  const hash = require("crypto").createHash("sha256");
  hash.update(dictionary.join(""));
  return hash.digest("hex");
};

  
  // Проверяем изменения в словаре
const checkForDictionaryUpdates = async () => {
  const newDictionaryText = await getWordsFromGoogleDocs();
  if (newDictionaryText) {
    const newDictionary = newDictionaryText.split(/\r?\n/).filter(Boolean);

    // Проверяем, изменился ли словарь
    const newHash = hashDictionary(newDictionary);
    if (newHash !== previousDictionaryHash) {
      dictionary = newDictionary;
      previousDictionaryHash = newHash;
      console.log("Словарь обновлен!");
    }
  }
};

// Интервал для проверки изменений в словаре
setInterval(checkForDictionaryUpdates, 1440 * min); // Проверяем каждые X минут

   
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



