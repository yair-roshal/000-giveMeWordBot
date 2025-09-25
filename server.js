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
const { give_me_keyboard, intervalSettingsKeyboard, startMenu, periodSettingsKeyboard, getHourKeyboard } = require('./constants/menus.js')
const getWordsFromGoogleDocs = require('./utils/getWordsFromGoogleDocs.js')
const formatDate = require('./utils/formatDate.js')
const { setUserInterval, getUserInterval, getUserIntervalMs, loadUserIntervals } = require('./utils/userIntervals.js')
const { createOrUpdateUserTimer, stopUserTimer, getUserTimerInfo, stopAllTimers } = require('./utils/userTimers.js')
// === СБРОС ВСЕХ ТАЙМЕРОВ ПРИ СТАРТЕ БОТА ===
console.log('[INIT] Останавливаю все пользовательские таймеры при старте бота...')
stopAllTimers()
console.log('[INIT] Все пользовательские таймеры сброшены.')
const { addLearnedWord, isWordLearned, loadLearnedWords } = require('./utils/learnedWords.js')
const { getUserIndex, setUserIndex } = require('./utils/userProgress.js')
// const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const PERIODS_FILE = path.join(__dirname, 'data/user_periods.json')
const { loadUserPeriods, saveUserPeriods, getUserPeriod, setUserPeriod } = require('./utils/userPeriods.js')

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

// Для хранения оригинала слова и индекса для каждого пользователя
const userCurrentOriginal = {}
const userCurrentIndex = {}

// callback_query при нажатии кнопке новых слов ==========================================
bot.on('callback_query', async (query) => {
  const chatId = query.from.id
  // console.log('query ---------------:>> ', query)

  if (query.data === 'give_me') {
    const nextIdx = getNextUnlearnedIndex(dictionary, chatId, getUserIndex(chatId) + 1)
    setUserIndex(chatId, nextIdx)
    const result = await sendingWordMessage(dictionary, nextIdx, bot, chatId)
    if (result && result.leftWords !== undefined) {
      userCurrentOriginal[chatId] = result.leftWords
    } else {
      console.error('sendingWordMessage returned invalid result:', result)
      userCurrentOriginal[chatId] = ''
    }
  } else if (query.data === 'interval_settings') {
    const userInterval = getUserInterval(chatId)
    const intervalText = userInterval ? `Текущий интервал: ${userInterval} минут` : 'Интервал не настроен'
    await bot.sendMessage(chatId, intervalText, {
      reply_markup: JSON.stringify(intervalSettingsKeyboard)
    })
    await bot.answerCallbackQuery(query.id)
    return
  } else if (query.data.startsWith('interval_')) {
    // Обработка выбора интервала
    const intervalValue = parseInt(query.data.replace('interval_', ''))
    
    if (intervalValue) {
      setUserInterval(chatId, intervalValue)
      // Остановить и создать таймер только для текущего пользователя
      createOrUpdateUserTimer(chatId, bot, dictionary, { currentIndex: getUserIndex(chatId) }, async (chatId, bot, dictionary, currentIndexRef) => {
        const timestamp = Date.now()
        const formattedDate = formatDate(timestamp)
        console.log(`Отправляем слово пользователю ${chatId} в ${formattedDate}`)
        try {
          const result = await sendingWordMessage(dictionary, currentIndexRef.currentIndex, bot, chatId)
          if (result && result.leftWords !== undefined) {
            userCurrentOriginal[chatId] = result.leftWords
          } else {
            console.error('sendingWordMessage returned invalid result:', result)
            userCurrentOriginal[chatId] = ''
          }
        } catch (err) {
          console.error('Ошибка в sendingWordMessage:', err)
        }
        if (currentIndexRef.currentIndex == dictionary.length - 1) {
          currentIndexRef.currentIndex = 0
        } else {
          currentIndexRef.currentIndex++
        }
        setUserIndex(chatId, currentIndexRef.currentIndex)
      })
      await bot.answerCallbackQuery(query.id, {
        text: `Интервал установлен: ${intervalValue} минут`
      })
      // Отправляем актуальные настройки
      const userInterval = getUserInterval(chatId)
      const timerInfo = getUserTimerInfo(chatId)
      const learnedWords = loadLearnedWords(chatId)
      const userIndex = getUserIndex(chatId)
      const userPeriod = getUserPeriod(chatId)
      let message = '🛠️ <b>Ваши настройки:</b>\n\n'
      message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин' : min + ' мин (по умолчанию)'}</b>\n`
      message += `⏳ Таймер: <b>${timerInfo.isActive ? 'активен' : 'неактивен'}</b>\n`
      message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
      message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
      message += `🕒 Период рассылки: <b>${userPeriod.start}:00 - ${userPeriod.end}:00</b>\n\n`
      if (learnedWords.length > 0) {
        message += '<b>Список выученных слов:</b>\n'
        learnedWords.forEach(word => {
          const idx = dictionary.findIndex(line => {
            const original = line.split(/[-—–−]/)[0].trim()
            return original === word
          })
          message += `• ${word} <i>(индекс: ${idx !== -1 ? idx : 'не найден'})</i>\n`
        })
      } else {
        message += 'Нет выученных слов.'
      }
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
      // Возвращаемся к основному меню
      try {
        await bot.editMessageReplyMarkup(
          give_me_keyboard,
          {
            chat_id: chatId,
            message_id: query.message.message_id
          }
        )
      } catch (err) {
        if (
          err.response &&
          err.response.body &&
          err.response.body.description &&
          err.response.body.description.includes('message is not modified')
        ) {
          // Игнорируем эту ошибку
        } else {
          console.error('Ошибка при editMessageReplyMarkup:', err)
        }
      }
    }
  } else if (query.data === 'back_to_main') {
    await bot.sendMessage(chatId, 'Главное меню:', {
      reply_markup: startMenu
    })
    await bot.answerCallbackQuery(query.id)
    return
  } else if (query.data === 'mark_learned') {
    const original = userCurrentOriginal[chatId]
    if (original) {
      addLearnedWord(chatId, original)
      console.log(`[LEARNED] chatId: ${chatId}, original: '${original}', index: ${getUserIndex(chatId)}`)
      await bot.answerCallbackQuery(query.id, { text: 'Слово отмечено как выученное!' })
    } else {
      console.log(`[LEARNED][SKIP] chatId: ${chatId}, не удалось получить оригинал`)
      await bot.answerCallbackQuery(query.id, { text: 'Не удалось определить оригинал слова!' })
    }
    // Найти следующее невыученное слово
    setUserIndex(chatId, getNextUnlearnedIndex(dictionary, chatId, (getUserIndex(chatId) || 0) + 1))
    const result = await sendingWordMessage(dictionary, getUserIndex(chatId), bot, chatId)
    if (result && result.leftWords !== undefined) {
      userCurrentOriginal[chatId] = result.leftWords
    } else {
      console.error('sendingWordMessage returned invalid result:', result)
      userCurrentOriginal[chatId] = ''
    }
    return
  } else if (query.data.startsWith('period_')) {
    const chatId = query.from.id
    const [_, start, end] = query.data.split('_')
    setUserPeriod(chatId, Number(start), Number(end))
    await bot.answerCallbackQuery(query.id, { text: `Период установлен: ${start}:00-${end}:00` })
    // Показываем настройки
    const userInterval = getUserInterval(chatId)
    const timerInfo = getUserTimerInfo(chatId)
    const learnedWords = loadLearnedWords(chatId)
    const userIndex = getUserIndex(chatId)
    const userPeriod = getUserPeriod(chatId)
    let message = '🛠️ <b>Ваши настройки:</b>\n\n'
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Таймер: <b>${timerInfo.isActive ? 'активен' : 'неактивен'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00 - ${userPeriod.end}:00</b>\n\n`
    if (learnedWords.length > 0) {
      message += '<b>Список выученных слов:</b>\n'
      learnedWords.forEach(word => {
        const idx = dictionary.findIndex(line => {
          const original = line.split(/[-—–−]/)[0].trim()
          return original === word
        })
        message += `• ${word} <i>(индекс: ${idx !== -1 ? idx : 'не найден'})</i>\n`
      })
    } else {
      message += 'Нет выученных слов.'
    }
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
    return
  } else if (query.data.startsWith('hour_start_')) {
    const chatId = query.from.id
    const start = Number(query.data.replace('hour_start_', ''))
    await bot.sendMessage(chatId, 'Выберите час окончания периода:', {
      reply_markup: JSON.stringify(getHourKeyboard(`hour_end_${start}_`, start))
    })
    await bot.answerCallbackQuery(query.id)
    return
  } else if (query.data.startsWith('hour_end_')) {
    const chatId = query.from.id
    const [_, __, start, end] = query.data.split('_')
    if (Number(end) <= Number(start)) {
      await bot.answerCallbackQuery(query.id, { text: 'Конец должен быть больше начала!' })
      return
    }
    setUserPeriod(chatId, Number(start), Number(end))
    await bot.answerCallbackQuery(query.id, { text: `Период установлен: ${start}:00-${end}:00` })
    // Показываем настройки
    const userInterval = getUserInterval(chatId)
    const timerInfo = getUserTimerInfo(chatId)
    const learnedWords = loadLearnedWords(chatId)
    const userIndex = getUserIndex(chatId)
    const userPeriod = getUserPeriod(chatId)
    let message = '🛠️ <b>Ваши настройки:</b>\n\n'
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Таймер: <b>${timerInfo.isActive ? 'активен' : 'неактивен'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00 - ${userPeriod.end}:00</b>\n\n`
    if (learnedWords.length > 0) {
      message += '<b>Список выученных слов:</b>\n'
      learnedWords.forEach(word => {
        const idx = dictionary.findIndex(line => {
          const original = line.split(/[-—–−]/)[0].trim()
          return original === word
        })
        message += `• ${word} <i>(индекс: ${idx !== -1 ? idx : 'не найден'})</i>\n`
      })
    } else {
      message += 'Нет выученных слов.'
    }
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML', reply_markup: startMenu })
    return
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

// === КОМАНДА ДЛЯ ПЕРЕЗАПУСКА ВСЕХ ТАЙМЕРОВ (только для админа) ===
bot.onText(/\/перезапусти_таймеры/, async (msg) => {
  const chatId = msg.chat.id
  if (String(chatId) !== String(CHAT_ID_ADMIN)) {
    await bot.sendMessage(chatId, '⛔ Только администратор может использовать эту команду.')
    return
  }
  await bot.sendMessage(chatId, '⏳ Перезапускаю все таймеры пользователей...')
  stopAllTimers()

  // Собираем всех chatId из user_settings.json (интервалы, прогресс, периоды)
  const userIntervals = loadUserIntervals()
  const userPeriods = loadUserPeriods()
  const { loadUserProgress } = require('./utils/userProgress.js')
  const userProgress = loadUserProgress()
  const allChatIds = new Set()
  if (userIntervals && typeof userIntervals === 'object') {
    Object.keys(userIntervals).forEach(id => allChatIds.add(id))
  }
  if (userPeriods && typeof userPeriods === 'object') {
    Object.keys(userPeriods).forEach(id => allChatIds.add(id))
  }
  if (userProgress && typeof userProgress === 'object') {
    Object.keys(userProgress).forEach(id => allChatIds.add(id))
  }

  // Если словарь не загружен — загружаем
  if (!dictionary || !Array.isArray(dictionary) || dictionary.length === 0) {
    const dictionaryText = await getWordsFromGoogleDocs()
    if (!dictionaryText) {
      await bot.sendMessage(chatId, '❌ Не удалось загрузить словарь. Таймеры не перезапущены.')
      return
    }
    dictionary = dictionaryText.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('🇮🇱') && !line.startsWith('___'))
  }

  allChatIds.forEach(userId => {
    createOrUpdateUserTimer(
      userId,
      bot,
      dictionary,
      { currentIndex: getUserIndex(userId) },
      async (userId, bot, dictionary, currentIndexRef) => {
        try {
          const result = await sendingWordMessage(dictionary, currentIndexRef.currentIndex, bot, userId)
          if (result && result.leftWords !== undefined) {
            userCurrentOriginal[userId] = result.leftWords
          } else {
            console.error('sendingWordMessage returned invalid result:', result)
            userCurrentOriginal[userId] = ''
          }
        } catch (err) {
          console.error('Ошибка в sendingWordMessage:', err)
        }
        if (currentIndexRef.currentIndex == dictionary.length - 1) {
          currentIndexRef.currentIndex = 0
        } else {
          currentIndexRef.currentIndex++
        }
        setUserIndex(userId, currentIndexRef.currentIndex)
      }
    )
  })
  await bot.sendMessage(chatId, `✅ Перезапуск завершён. Активных таймеров: ${allChatIds.size}`)
})

// Показываем меню с новой кнопкой при /start
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
    contentType: 'image/jpeg', // явно указываем тип контента для фото
  }

  // Сначала отправляем меню
  await bot.sendMessage(chatId, 'Меню:', { reply_markup: startMenu })

  try {
    await bot.sendPhoto(chatId, photoPath, optionsMessage2)
    setUserIndex(chatId, getNextUnlearnedIndex(dictionary, chatId, (getUserIndex(chatId) || 0)))
    const result = await sendingWordMessage(dictionary, getUserIndex(chatId), bot, chatId)
    if (result && result.leftWords !== undefined) {
      userCurrentOriginal[chatId] = result.leftWords
    } else {
      console.error('sendingWordMessage returned invalid result:', result)
      userCurrentOriginal[chatId] = ''
    }
  } catch (err) {
    console.error('Ошибка при отправке сообщения:', err)
    await bot.sendMessage(chatId, 'Извините, произошла ошибка при отправке слова. Пожалуйста, попробуйте позже.')
    return
  }

  if (getUserIndex(chatId) == dictionary.length - 1) {
    setUserIndex(chatId, 0)
  } else {
    setUserIndex(chatId, getUserIndex(chatId) + 1)
  }

  // Запускаем таймеры ПОСЛЕ загрузки словаря
  console.log('[AUTO] Начинаем автоматический запуск таймеров после загрузки словаря')
  const userIntervals = loadUserIntervals()
  console.log('[AUTO] userIntervals:', userIntervals)
  
  // Получаем список всех пользователей из разных файлов
  const allChatIds = new Set()
  
  // Из user_intervals.json
  if (userIntervals && typeof userIntervals === 'object') {
    Object.keys(userIntervals).forEach(chatId => allChatIds.add(chatId))
  }
  
  // Из user_periods.json
  const userPeriods = loadUserPeriods()
  console.log('[AUTO] userPeriods:', userPeriods)
  if (userPeriods && typeof userPeriods === 'object') {
    Object.keys(userPeriods).forEach(chatId => allChatIds.add(chatId))
  }
  
  // Из user_progress.json
  const { loadUserProgress } = require('./utils/userProgress.js')
  const userProgress = loadUserProgress()
  console.log('[AUTO] userProgress:', userProgress)
  if (userProgress && typeof userProgress === 'object') {
    Object.keys(userProgress).forEach(chatId => allChatIds.add(chatId))
  }
  
  console.log('[AUTO] Все найденные chatIds:', Array.from(allChatIds))
  
  // Запускаем таймеры для всех найденных пользователей
  allChatIds.forEach(chatId => {
    // Получаем настройки пользователя
    const userInterval = getUserInterval(chatId)
    const timerInfo = getUserTimerInfo(chatId)
    const learnedWords = loadLearnedWords(chatId)
    const userIndex = getUserIndex(chatId)
    const userPeriod = getUserPeriod(chatId)
    
    // Проверяем валидность индекса и словаря
    if (!dictionary || dictionary.length === 0) {
      console.error(`[AUTO] Словарь пуст, пропускаем chatId=${chatId}`)
      return
    }
    
    if (userIndex < 0 || userIndex >= dictionary.length) {
      console.log(`[AUTO] Корректируем индекс для chatId=${chatId} с ${userIndex} на 0`)
      setUserIndex(chatId, 0)
    }
    
    // Формируем строку лога
    let logMsg = `\n[НАСТРОЙКИ] chatId=${chatId}\n`;
    logMsg += `🛠️ Ваши настройки:` + "\n";
    logMsg += `⏱️ Интервал: ${userInterval ? userInterval + ' мин' : min + ' мин (по умолчанию)'}\n`;
    logMsg += `⏳ Таймер: ${timerInfo.isActive ? 'активен' : 'неактивен'}\n`;
    logMsg += `📚 Выучено слов: ${learnedWords.length}\n`;
    logMsg += `🔢 Индекс (user_progress): ${getUserIndex(chatId)}\n`;
    logMsg += `🕒 Период рассылки: ${userPeriod.start}:00 - ${userPeriod.end}:00\n`;
    console.log(logMsg)
    console.log(`[AUTO] Запускаем таймер для chatId=${chatId}`)
    createOrUpdateUserTimer(
      chatId,
      bot,
      dictionary,
      { currentIndex: getUserIndex(chatId) },
      async (chatId, bot, dictionary, currentIndexRef) => {
        console.log(`[CALLBACK] Начинаем отправку слова для chatId=${chatId}`)
        const timestamp = Date.now()
        const formattedDate = formatDate(timestamp)
        console.log(`(auto) Отправляем слово пользователю ${chatId} в ${formattedDate}`)
        try {
          console.log(`[CALLBACK] Вызываем sendingWordMessage для chatId=${chatId}, index=${currentIndexRef.currentIndex}`)
          const result = await sendingWordMessage(dictionary, currentIndexRef.currentIndex, bot, chatId)
          console.log(`[CALLBACK] sendingWordMessage завершился для chatId=${chatId}, result:`, result)
          if (result && result.leftWords !== undefined) {
            userCurrentOriginal[chatId] = result.leftWords
          } else {
            console.error('sendingWordMessage returned invalid result:', result)
            userCurrentOriginal[chatId] = ''
          }
        } catch (err) {
          console.error('Ошибка в sendingWordMessage:', err)
        }
        if (currentIndexRef.currentIndex == dictionary.length - 1) {
          currentIndexRef.currentIndex = 0
        } else {
          currentIndexRef.currentIndex++
        }
        setUserIndex(chatId, currentIndexRef.currentIndex)
        console.log(`[CALLBACK] Завершили отправку слова для chatId=${chatId}, новый индекс: ${currentIndexRef.currentIndex}`)
      }
    )
  })
  console.log('[AUTO] Автоматический запуск таймеров завершён')

  let previousDictionaryHash = null // Для проверки изменений в словаре

  // Функция для хеширования словаря (для проверки изменений)
  const hashDictionary = (dictionary) => {
    const hash = require('crypto').createHash('sha256')
    hash.update(dictionary.join(''))
    return hash.digest('hex')
  }

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
      setUserIndex(chatId, 0)
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

  // setInterval(
  //   async () => {
  //     let isTimeForSending = false
  //
  //     let currentDate = new Date()
  //     let nowHours = currentDate.getHours()
  //     let nowMinutes = currentDate.getMinutes()
  //
  //     if (process.env.NODE_ENV === 'dev') {
  //       isTimeForSending = true
  //     } else if (nowHours < clockEnd && nowHours > clockStart) {
  //       isTimeForSending = true
  //     } else {
  //       console.log(`it isn't time for sending messages  -   ${nowHours}:${nowMinutes}`)
  //     }
  //
  //     //  await checkForDictionaryUpdates()
  //     if (isTimeForSending) {
  //       const timestamp = Date.now()
  //       const formattedDate = formatDate(timestamp)
  //
  //       await checkForDictionaryUpdates()
  //       console.log('______________')
  //       console.log('formattedDate', formattedDate)
  //
  //       setUserIndex(chatId, getNextUnlearnedIndex(dictionary, chatId, (getUserIndex(chatId) || 0) + 1))
  //       const result = await sendingWordMessage(dictionary, getUserIndex(chatId), bot, chatId)
  //       userCurrentOriginal[chatId] = result.leftWords
  //
  //       if (getUserIndex(chatId) == dictionary.length - 1) {
  //         setUserIndex(chatId, 0)
  //       } else {
  //         setUserIndex(chatId, getUserIndex(chatId) + 1)
  //       }
  //     }
  //   },
  //   interval,
  // )
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

// Обработка кнопки "ℹ️ Показать настройки"
bot.on('message', async (msg) => {
  if (msg.text === 'ℹ️ Показать настройки') {
    const chatId = msg.chat.id
    const userInterval = getUserInterval(chatId)
    const timerInfo = getUserTimerInfo(chatId)
    const learnedWords = loadLearnedWords(chatId)
    const userIndex = getUserIndex(chatId)
    const userPeriod = getUserPeriod(chatId)

    let message = '🛠️ <b>Ваши настройки:</b>\n\n'
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Таймер: <b>${timerInfo.isActive ? 'активен' : 'неактивен'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00 - ${userPeriod.end}:00</b>\n\n`
    message += `\n🆔 User ID: <b>${chatId}</b>\n\n`

    if (learnedWords.length > 0) {
      message += '<b>Список выученных слов:</b>\n'
      learnedWords.forEach(word => {
        // Поиск индекса слова в словаре
        const idx = dictionary.findIndex(line => {
          const original = line.split(/[-—–−]/)[0].trim()
          return original === word
        })
        message += `• ${word} <i>(индекс: ${idx !== -1 ? idx : 'не найден'})</i>\n`
      })
    } else {
      message += 'Нет выученных слов.'
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return;
  }
  // Добавлено: обработка кнопки "⚙️ Настройки интервала"
  if (msg.text === '⚙️ Настройки интервала') {
    const chatId = msg.chat.id
    const userInterval = getUserInterval(chatId)
    const intervalText = userInterval ? `Текущий интервал: ${userInterval} минут` : 'Интервал не настроен'
    await bot.sendMessage(chatId, intervalText, {
      reply_markup: JSON.stringify(intervalSettingsKeyboard)
    })
    return
  }
  if (msg.text === '🛠️ Сменить период') {
    await bot.sendMessage(msg.chat.id, 'Выберите час начала периода:', {
      reply_markup: JSON.stringify(getHourKeyboard('hour_start_'))
    })
    return
  }
  // === Обработка кнопки "Закрыть" ===
  if (msg.text === 'Закрыть') {
    await bot.sendMessage(msg.chat.id, 'Меню закрыто.', {
      reply_markup: { remove_keyboard: true }
    })
    // После закрытия меню отправляем кнопку для открытия меню
    await bot.sendMessage(msg.chat.id, 'Чтобы открыть меню снова, нажмите кнопку ниже:', {
      reply_markup: {
        keyboard: [[{ text: 'Открыть меню' }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    })
    return
  }
  // === Обработка кнопки "Открыть меню" ===
  if (msg.text === 'Открыть меню') {
    await bot.sendMessage(msg.chat.id, 'Меню:', {
      reply_markup: startMenu
    })
    return
  }
})

function getNextUnlearnedIndex(dictionary, chatId, fromIndex = 0) {
  if (!dictionary || !dictionary.length) return 0
  let idx = fromIndex % dictionary.length
  let attempts = 0
  while (true) {
    const line = dictionary[idx]
    let original = line
    const symbolsArray = ['-', '—', '–', '—', '−']
    symbolsArray.forEach((symbol) => {
      if (line && line.indexOf(symbol) !== -1) {
        original = line.split(symbol)[0].trim()
      }
    })
    if (!isWordLearned(chatId, original) || attempts >= dictionary.length) {
      break
    }
    idx = (idx + 1) % dictionary.length
    attempts++
  }
  return idx
}

// После загрузки словаря и перед обработкой команд
// Удаляем старый автоматический запуск - теперь он в команде /start

module.exports = {
  getUserPeriod,
}
