const dotenv = require('dotenv')
dotenv.config()
const TelegramBot = require('node-telegram-bot-api')
const { clockStart, clockEnd } = require('./constants/intervals.js')
// const getAllWordsFromFiles = require("./utils/getAllWordsFromFiles.js")
// const { dictionaryText } = getAllWordsFromFiles()
const { sec, ms, min, interval } = require('./constants/intervals.js')
const { textMessageHtml } = require('./constants/texts.js')
const sendingWordMessage = require('./utils/prepareMessage.js')
const dictionaryTextToFile = require('./utils/dictionaryTextToFile.js')
const { give_me_keyboard, intervalSettingsKeyboard, startMenu } = require('./constants/menus.js')
const getWordsFromGoogleDocs = require('./utils/getWordsFromGoogleDocs.js')
const formatDate = require('./utils/formatDate.js')
const { setUserInterval, getUserInterval, getUserIntervalMs } = require('./utils/userIntervals.js')
const { createOrUpdateUserTimer, stopUserTimer, getUserTimerInfo, stopAllTimers } = require('./utils/userTimers.js')
// const crypto = require('crypto')

var currentIndex = 0
// const fs = require("fs")
// const path = require("path")

// const pidFile = path.join(__dirname, "bot.pid")

// // Проверяем, существует ли PID-файл
// if (fs.existsSync(pidFile)) {
//   const pid = parseInt(fs.readFileSync(pidFile, "utf8"), 10)

//   try {
//     // Проверяем, активен ли процесс
//     process.kill(pid, 0)
//     console.log(`Bot is already running with PID ${pid}. Exiting...`)
//     process.exit(1) // Завершаем текущий процесс
//   } catch (err) {
//     // Если процесс не существует, продолжаем
//     console.log(
//       "Stale PID file found. Starting new bot instance...",
//       new Date().toLocaleTimeString("en-GB")
//     )
//     fs.unlinkSync(pidFile) // Удаляем старый PID-файл
//   }
// }

// // Записываем текущий PID в файл
// fs.writeFileSync(pidFile, process.pid.toString())

// // Удаляем PID-файл при завершении процесса
// process.on("exit", () => fs.unlinkSync(pidFile))
// process.on("SIGINT", () => {
//   fs.unlinkSync(pidFile)
//   process.exit(0)
// })

// =================================

// const token =
//     process.env.NODE_ENV === 'prod'
//         ? process.env.TELEGRAM_BOT_TOKEN
//         : process.env.TELEGRAM_BOT_TOKEN_testing

const token = process.env.TELEGRAM_BOT_TOKEN
// console.log('token :>> ', token)
console.log('process.env.NODE_ENV', process.env.NODE_ENV)
const bot = new TelegramBot(token, {
  polling: true,
  // contentTypeFix: false,
})
//caching dictionaries======
// dictionaryTextToFile()
// logSessions()

var optionsMessage = {
  // keyboard=====
  // reply_markup: JSON.stringify(start_keyboard),
  parse_mode: 'HTML',
  //disable because we don't want show description links
  disable_web_page_preview: true,
}

const CHAT_ID_ADMIN = process.env.CHAT_ID_ADMIN
bot.sendMessage(CHAT_ID_ADMIN, textMessageHtml, optionsMessage)
var dictionary

// Добавляем обработку ошибок polling
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 секунд

bot.on('polling_error', async (error) => {
  console.error('Polling error:', error.code, error.message);
  
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    try {
      await bot.stopPolling();
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      await bot.startPolling();
      console.log('Successfully reconnected to Telegram');
      reconnectAttempts = 0;
    } catch (reconnectError) {
      console.error('Failed to reconnect:', reconnectError);
    }
  } else {
    console.error('Max reconnection attempts reached. Please check your internet connection and Telegram API status.');
    // Можно добавить уведомление администратору
    if (CHAT_ID_ADMIN) {
      bot.sendMessage(CHAT_ID_ADMIN, '⚠️ Бот остановлен из-за проблем с подключением. Требуется ручной перезапуск.');
    }
  }
});

// Добавляем обработку необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Отправляем уведомление администратору
  if (CHAT_ID_ADMIN) {
    bot.sendMessage(CHAT_ID_ADMIN, `⚠️ Критическая ошибка в боте: ${err.message}`);
  }
});

// Обработка завершения работы приложения
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT, останавливаем все таймеры...');
  stopAllTimers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM, останавливаем все таймеры...');
  stopAllTimers();
  process.exit(0);
});

// callback_query при нажатии кнопке новых слов ==========================================
bot.on('callback_query', async (query) => {
  const chatId = query.from.id
  // console.log('query ---------------:>> ', query)

  if (query.data === 'give_me') {
    sendingWordMessage(dictionary, currentIndex, bot, chatId)
    if (currentIndex == dictionary?.length - 1) {
      currentIndex = 0
    } else {
      currentIndex++
    }
  } else if (query.data === 'interval_settings') {
    // Показываем меню настроек интервала
    const userInterval = getUserInterval(chatId)
    const intervalText = userInterval ? `Текущий интервал: ${userInterval} минут` : 'Интервал не настроен'
    
    await bot.editMessageReplyMarkup(
      intervalSettingsKeyboard,
      {
        chat_id: chatId,
        message_id: query.message.message_id
      }
    )
    
    await bot.answerCallbackQuery(query.id, {
      text: intervalText
    })
  } else if (query.data.startsWith('interval_')) {
    // Обработка выбора интервала
    const intervalValue = parseInt(query.data.replace('interval_', ''))
    
    if (intervalValue) {
      setUserInterval(chatId, intervalValue)
      
      // Создаем или обновляем таймер пользователя
      createOrUpdateUserTimer(chatId, bot, dictionary, { currentIndex }, async (chatId, bot, dictionary, currentIndexRef) => {
        const timestamp = Date.now()
        const formattedDate = formatDate(timestamp)
        console.log(`Отправляем слово пользователю ${chatId} в ${formattedDate}`)
        
        try {
          await sendingWordMessage(dictionary, currentIndexRef.currentIndex, bot, chatId)
        } catch (err) {
          console.error('Ошибка в sendingWordMessage:', err)
        }

        if (currentIndexRef.currentIndex == dictionary.length - 1) {
          currentIndexRef.currentIndex = 0
        } else {
          currentIndexRef.currentIndex++
        }
      })
      
      await bot.answerCallbackQuery(query.id, {
        text: `Интервал установлен: ${intervalValue} минут`
      })
      
      // Возвращаемся к основному меню
      await bot.editMessageReplyMarkup(
        give_me_keyboard,
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      )
    }
  } else if (query.data === 'back_to_main') {
    // Возврат к обычной клавиатуре
    await bot.sendMessage(chatId, 'Главное меню:', {
      reply_markup: {
        keyboard: [
          [{ text: 'Классика333' }, { text: 'Закрыть' }],
          [{ text: 'Заказать разработку бота' }],
          [{ text: 'Про автора' }],
          [{ text: '⚙️ Настройки интервала' }]
        ],
        one_time_keyboard: true
      }
    })
    await bot.answerCallbackQuery(query.id)
  }
})

// bot.on('polling_error', (error) => {
//   console.error('Polling error:', error.code, error.message)
//   // Можно добавить логику повторного подключения или просто логировать
// })

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason)
//   // Здесь можно отправить уведомление, или залогировать
// })

// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception thrown:', err)
//   // Здесь можно принять решение завершить процесс или попытаться продолжить
// })

// Команда для просмотра текущего интервала
bot.onText(/\/interval/, async (msg) => {
  const chatId = msg.chat.id
  const userInterval = getUserInterval(chatId)
  const timerInfo = getUserTimerInfo(chatId)
  
  let message = '📊 Информация о вашем интервале:\n\n'
  
  if (userInterval) {
    message += `✅ Установлен интервал: ${userInterval} минут\n`
    message += `🔄 Таймер: ${timerInfo.isActive ? 'активен' : 'неактивен'}\n\n`
    message += 'Используйте кнопку "⚙️ Настройки интервала" для изменения'
  } else {
    message += `❌ Интервал не настроен\n`
    message += `📝 Используется интервал по умолчанию: ${min} минут\n\n`
    message += 'Используйте кнопку "⚙️ Настройки интервала" для настройки'
  }
  
  await bot.sendMessage(chatId, message)
})

// start ===============================================
bot.onText(/\/start/, async (msg) => {
  console.log('Получена команда /start')
  const dictionaryText = await getWordsFromGoogleDocs()
  
  if (!dictionaryText) {
    console.error('Не удалось получить словарь из Google Docs')
    const chatId = msg.chat.id
    await bot.sendMessage(chatId, 'Извините, произошла ошибка при загрузке словаря. Пожалуйста, попробуйте позже.', {
      reply_markup: startMenu
    })
    return
  }

  // Разбиваем текст на строки и фильтруем пустые
  dictionary = dictionaryText.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('🇮🇱') && !line.startsWith('___')) // Фильтруем заголовки и разделители
  
  // Добавляем проверку валидности словаря
  if (!Array.isArray(dictionary) || dictionary.length === 0) {
    console.error('Получен невалидный словарь:', {
      isArray: Array.isArray(dictionary),
      length: dictionary?.length,
      firstFewLines: dictionary?.slice(0, 3)
    })
    const chatId = msg.chat.id
    await bot.sendMessage(chatId, 'Извините, получен невалидный словарь. Пожалуйста, попробуйте позже.', {
      reply_markup: startMenu
    })
    return
  }

  // Проверяем формат каждой строки словаря
  const invalidLines = dictionary.filter(line => {
    const hasValidSeparator = ['-', '—', '–', '—', '−'].some(sep => line.includes(sep))
    return !hasValidSeparator
  })
  
  if (invalidLines.length > 0) {
    console.error('Найдены строки с неверным форматом:', {
      count: invalidLines.length,
      examples: invalidLines.slice(0, 5)
    })
  }

  console.log(`Словарь успешно загружен. Количество слов: ${dictionary.length}`)
  
  const chatId = msg.chat.id
  var photoPath = __dirname + '/media/logo.jpg'

  // Получаем интервал пользователя
  const userInterval = getUserInterval(chatId)
  const intervalText = userInterval ? `${userInterval} минут` : `${min} минут (по умолчанию)`
  
  var optionsMessage2 = {
    caption: `Catch the first word, the rest will be in ${intervalText}`,
    reply_markup: JSON.stringify(give_me_keyboard),
  }

  // Сначала отправляем меню
  await bot.sendMessage(chatId, 'Меню:', { reply_markup: startMenu })

  try {
    await bot.sendPhoto(chatId, photoPath, optionsMessage2)
    await sendingWordMessage(dictionary, currentIndex, bot, chatId)
  } catch (err) {
    console.error('Ошибка при отправке сообщения:', err)
    await bot.sendMessage(chatId, 'Извините, произошла ошибка при отправке слова. Пожалуйста, попробуйте позже.')
    return
  }

  if (currentIndex == dictionary.length - 1) {
    currentIndex = 0
  } else {
    currentIndex++
  }

  let previousDictionaryHash = null // Для проверки изменений в словаре

  // Функция для хеширования словаря (для проверки изменений)
  const hashDictionary = (dictionary) => {
    const hash = require('crypto').createHash('sha256')
    hash.update(dictionary.join(''))
    return hash.digest('hex')
  }

  // // Проверяем изменения в словаре
  // const checkForDictionaryUpdates = async () => {
  //   const newDictionaryText = await getWordsFromGoogleDocs()
  //   if (newDictionaryText) {
  //     const newDictionary = newDictionaryText.split(/\r?\n/).filter(Boolean)

  //     // Проверяем, изменился ли словарь
  //     const newHash = hashDictionary(newDictionary)
  //     if (newHash !== previousDictionaryHash) {
  //       dictionary = newDictionary
  //       previousDictionaryHash = newHash
  //       console.log('Словарь обновлен!')
  //       currentIndex = 0
  //     } else {
  //       console.log('Словарь не изменен!')
  //     }
  //   }
  // }

  // Проверяем изменения в словаре
  const checkForDictionaryUpdates = async () => {
    const newDictionaryText = await getWordsFromGoogleDocs()
    if (!newDictionaryText) {
      console.error('Не удалось получить обновленный словарь из Google Docs')
      return
    }
    
    const newDictionary = newDictionaryText.split(/\r?\n/).filter(Boolean)

    // Сравнение: если больше 10 отличий
    const diffCount = getDictionaryDiffCount(dictionary, newDictionary)

    if (diffCount > 10) {
      dictionary = newDictionary
      console.log(`Словарь обновлен! Различий: ${diffCount}`)
      currentIndex = 0
    } else {
      console.log(`Словарь не изменен (различий: ${diffCount})`)
    }
  }

  // Функция для подсчета различий между двумя массивами слов
  function getDictionaryDiffCount(oldDict, newDict) {
    const oldSet = new Set(oldDict)
    const newSet = new Set(newDict)

    let diff = 0
    for (let word of newSet) {
      if (!oldSet.has(word)) diff++
    }
    for (let word of oldSet) {
      if (!newSet.has(word)) diff++
    }

    return diff
  }

  // Интервал для проверки изменений в словаре
  // setInterval(checkForDictionaryUpdates, 1 * min); // Проверяем каждые X минут

  setInterval(
    async () => {
      let isTimeForSending = false

      let currentDate = new Date()
      let nowHours = currentDate.getHours()
      let nowMinutes = currentDate.getMinutes()

      if (process.env.NODE_ENV === 'dev') {
        isTimeForSending = true
      } else if (nowHours < clockEnd && nowHours > clockStart) {
        isTimeForSending = true
      } else {
        console.log(`it isn't time for sending messages  -   ${nowHours}:${nowMinutes}`)
      }

      //  await checkForDictionaryUpdates()
      if (isTimeForSending) {
        const timestamp = Date.now()
        const formattedDate = formatDate(timestamp)

        await checkForDictionaryUpdates()
        console.log('______________')
        console.log('formattedDate', formattedDate)

        try {
          await sendingWordMessage(dictionary, currentIndex, bot, chatId)
        } catch (err) {
          console.error('Ошибка в sendingWordMessage:', err)
        }

        if (currentIndex == dictionary.length - 1) {
          currentIndex = 0
        } else {
          currentIndex++
        }
      }
    },

    interval,
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

console.log('server started with interval:', interval / ms / sec, 'min')

// {
//     process.env.NODE_ENV === 'dev' &&
//         sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN) &&
//         setInterval(
//             () => sendingWordMessage(dictionary, bot, CHAT_ID_ADMIN),
//             interval,
//         )
// }

// Обработка reply-кнопки "⚙️ Настройки интервала"
bot.on('message', async (msg) => {
  if (msg.text === '⚙️ Настройки интервала') {
    // Показываем инлайн-меню выбора интервала
    await bot.sendMessage(msg.chat.id, 'Выберите интервал появления новых слов:', {
      reply_markup: intervalSettingsKeyboard
    })
  }
})
