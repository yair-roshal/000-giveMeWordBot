const dotenv = require('dotenv')
dotenv.config()
const TelegramBot = require('node-telegram-bot-api')
const { clockStart, clockEnd } = require('./constants/intervals.js')
// const getAllWordsFromFiles = require("./utils/getAllWordsFromFiles.js")
// const { dictionaryText } = getAllWordsFromFiles()
const { sec, ms, min, interval } = require('./constants/intervals.js')
const { textMessageHtml } = require('./constants/texts.js')
const sendingWordMessage = require('./utils/prepareMessage.js')
const { sendWordMessage } = require('./utils/sendWordMessage.js')
const { getNextUnlearnedIndex: getNextUnlearnedIndexNew } = require('./utils/getNextUnlearnedIndex.js')
const dictionaryTextToFile = require('./utils/dictionaryTextToFile.js')
const { give_me_keyboard, intervalSettingsKeyboard, startMenu, periodSettingsKeyboard, getHourKeyboard, dictionarySettingsKeyboard } = require('./constants/menus.js')
const getWordsFromGoogleDocs = require('./utils/getWordsFromGoogleDocs.js')
const { getDictionary } = require('./utils/getDictionary.js')
const { getUserDictionary, setUserDictionary, removeUserDictionary, validateGoogleDocUrl } = require('./utils/userDictionaries.js')
const formatDate = require('./utils/formatDate.js')
const { setUserInterval, getUserInterval, getUserIntervalMs, loadUserIntervals } = require('./utils/userIntervals.js')
const { createOrUpdateUserTimer, stopUserTimer, getUserTimerInfo, stopAllTimers } = require('./utils/userTimers.js')
const { createTimerCallback } = require('./utils/timerCallback.js')
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
process.on("exit", () => {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile)
  }
})
process.on("SIGINT", () => {
  console.log('Получен сигнал SIGINT, очищаю PID и останавливаю таймеры...')
  stopAllTimers()
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile)
  }
  process.exit(0)
})
process.on("SIGTERM", () => {
  console.log('Получен сигнал SIGTERM, очищаю PID и останавливаю таймеры...')
  stopAllTimers()
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile)
  }
  process.exit(0)
})

// =================================

// const token =
//     process.env.NODE_ENV === 'prod'
//         ? process.env.TELEGRAM_BOT_TOKEN
//         : process.env.TELEGRAM_BOT_TOKEN_testing

const token = process.env.TELEGRAM_BOT_TOKEN
// console.log('token :>> ', token)
console.log('process.env.NODE_ENV', process.env.NODE_ENV)
console.log(`[DEFAULTS] Интервал по умолчанию: ${min} мин, Период по умолчанию: ${clockStart}:00-${clockEnd}:00`)

// Создаем бота с дополнительными параметрами для стабильности
const bot = new TelegramBot(token, {
  polling: {
    interval: 1000, // Интервал между запросами к Telegram API (мс)
    autoStart: false, // Не запускаем автоматически, будем контролировать вручную
    params: {
      timeout: 10, // Таймаут для long polling (сек)
    }
  },
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
    timeout: 60000, // Общий таймаут для HTTP запросов (мс)
  },
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
var dictionary

// Запускаем бота с контролем ошибок
async function startBot() {
  try {
    console.log('Starting bot polling...');
    
    // Сначала пытаемся получить информацию о боте для проверки токена
    const botInfo = await bot.getMe();
    console.log(`Bot info: @${botInfo.username} (${botInfo.first_name})`);
    
    // Очищаем webhook, если он был установлен ранее
    try {
      await bot.deleteWebhook();
      console.log('Webhook cleared (if existed)');
    } catch (webhookError) {
      // Игнорируем ошибки очистки webhook
      console.log('Webhook clear attempted');
    }
    
    await bot.startPolling();
    console.log('Bot polling started successfully');
    
    // Отправляем уведомление администратору только после успешного запуска
    if (CHAT_ID_ADMIN) {
      await bot.sendMessage(CHAT_ID_ADMIN, `✅ Бот запущен успешно!\n${textMessageHtml}`, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: JSON.stringify(require('./constants/menus.js').start_inline_keyboard)
      });
    }
  } catch (error) {
    console.error('Failed to start bot polling:', error);
    
    // Очищаем PID файл при неудачном запуске
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    process.exit(1);
  }
}

// Запускаем бота
startBot();

// Добавляем обработку ошибок polling
let reconnectAttempts = 0;
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 секунд

bot.on('polling_error', async (error) => {
  console.error('Polling error:', error.code, error.message);
  
  // Проверяем специфические ошибки, которые не требуют переподключения
  if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
    console.log('409 Conflict detected - another bot instance may be running');
    if (isReconnecting) {
      console.log('Already reconnecting, skipping...');
      return;
    }
    isReconnecting = true;
  }
  
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !isReconnecting) {
    reconnectAttempts++;
    isReconnecting = true;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    try {
      // Принудительно останавливаем polling
      await bot.stopPolling({ cancel: true, reason: 'Reconnecting after error' });
      
      // Ждем перед переподключением
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY * reconnectAttempts));
      
      // Запускаем polling заново
      await bot.startPolling({ restart: true });
      console.log('Successfully reconnected to Telegram');
      reconnectAttempts = 0;
      isReconnecting = false;
    } catch (reconnectError) {
      console.error('Failed to reconnect:', reconnectError);
      isReconnecting = false;
      
      // Если не удалось переподключиться, попробуем еще раз через больший интервал
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          isReconnecting = false;
        }, RECONNECT_DELAY * 2);
      }
    }
  } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached. Stopping bot.');
    isReconnecting = false;
    
    // Уведомляем администратора
    try {
      if (CHAT_ID_ADMIN) {
        await bot.sendMessage(CHAT_ID_ADMIN, '⚠️ Бот остановлен из-за проблем с подключением. Требуется ручной перезапуск.');
      }
    } catch (notifyError) {
      console.error('Failed to notify admin:', notifyError);
    }
    
    // Очищаем PID файл и завершаем процесс
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    process.exit(1);
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

// Дополнительная обработка для graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`Получен сигнал ${signal}, выполняю graceful shutdown...`);
  
  try {
    // Останавливаем все таймеры
    stopAllTimers();
    
    // Останавливаем polling
    if (bot && typeof bot.stopPolling === 'function') {
      await bot.stopPolling({ cancel: true, reason: `Shutdown by ${signal}` });
      console.log('Bot polling stopped');
    }
    
    // Очищаем PID файл
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
      console.log('PID file cleaned');
    }
    
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
  
  process.exit(0);
}

// Для хранения оригинала слова и индекса для каждого пользователя
const userCurrentOriginal = {}
const userCurrentIndex = {}
// Для отслеживания состояний пользователей
const userStates = {}

// callback_query при нажатии кнопке новых слов ==========================================
bot.on('callback_query', async (query) => {
  const chatId = query.from.id
  // console.log('query ---------------:>> ', query)

  if (query.data === 'give_me') {
    try {
      const nextIdx = await getNextUnlearnedIndexNew(chatId, getUserIndex(chatId) + 1)
      setUserIndex(chatId, nextIdx)
      const result = await sendWordMessage(chatId, nextIdx, bot)
      if (result && result.leftWords !== undefined) {
        userCurrentOriginal[chatId] = result.leftWords
      } else {
        console.error('sendWordMessage returned invalid result:', result)
        userCurrentOriginal[chatId] = ''
      }
    } catch (error) {
      console.error('Ошибка при отправке слова через кнопку give_me:', error)
      await bot.sendMessage(chatId, 'Произошла ошибка при загрузке слова. Попробуйте позже.')
    }
  } else if (query.data === 'start_bot') {
    // Обрабатываем нажатие кнопки "🚀 Start Bot" - выполняем логику команды /start
    await handleStartCommand(chatId, bot)
    await bot.answerCallbackQuery(query.id, { text: 'Бот запущен! 🚀' })
    return
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
      const timerCallback = await createTimerCallback(userCurrentOriginal)
      createOrUpdateUserTimer(chatId, bot, dictionary, { currentIndex: getUserIndex(chatId) }, timerCallback)
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
      message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин (пользовательский)' : min + ' мин (по умолчанию)'}</b>\n`
      message += `⏳ Статус авторассылки: <b>${timerInfo.isActive ? 'активна' : 'неактивна'}</b>\n`
      message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
      message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
      message += `🕒 Период рассылки: <b>${userPeriod.start}:00-${userPeriod.end}:00</b>\n\n`
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
  } else if (query.data === 'open_main_menu') {
    await bot.sendMessage(chatId, 'Меню:', {
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
    try {
      const nextIdx = await getNextUnlearnedIndexNew(chatId, (getUserIndex(chatId) || 0) + 1)
      setUserIndex(chatId, nextIdx)
      const result = await sendWordMessage(chatId, nextIdx, bot)
      if (result && result.leftWords !== undefined) {
        userCurrentOriginal[chatId] = result.leftWords
      } else {
        console.error('sendWordMessage returned invalid result:', result)
        userCurrentOriginal[chatId] = ''
      }
    } catch (error) {
      console.error('Ошибка при отправке следующего слова после mark_learned:', error)
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
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин (пользовательский)' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Статус авторассылки: <b>${timerInfo.isActive ? 'активна' : 'неактивна'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00-${userPeriod.end}:00</b>\n\n`
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
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин (пользовательский)' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Статус авторассылки: <b>${timerInfo.isActive ? 'активна' : 'неактивна'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00-${userPeriod.end}:00</b>\n\n`
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
  } else if (query.data === 'dictionary_info') {
    // Показать информацию о текущем словаре
    const chatId = query.from.id
    const userDict = getUserDictionary(chatId)
    let message = '📚 <b>Информация о словаре</b>\n\n'
    
    if (userDict) {
      message += '✅ <b>Ваш личный словарь</b>\n'
      message += `📎 Ссылка: ${userDict.url}\n`
      message += `📅 Добавлен: ${new Date(userDict.createdAt).toLocaleDateString('ru-RU')}\n`
      message += `🔄 Обновлен: ${new Date(userDict.updatedAt).toLocaleDateString('ru-RU')}\n\n`
      message += '💡 <i>Словарь загружается из вашего Google Doc при каждом запросе слова</i>'
    } else {
      message += '📖 <b>Словарь по умолчанию</b>\n'
      message += '🌍 Универсальный словарь для изучения языков\n'
      message += '🔄 Автоматически обновляется\n\n'
      message += '💡 <i>Вы можете добавить свой персональный словарь из Google Docs</i>'
    }
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
    await bot.answerCallbackQuery(query.id)
    return
  } else if (query.data === 'add_custom_dictionary') {
    // Запрос на добавление пользовательского словаря
    const chatId = query.from.id
    const message = `📚 <b>Добавление персонального словаря</b>

🔗 Отправьте ссылку на ваш Google Docs документ или его ID.

📋 <b>Формат документа:</b>
Каждая строка должна содержать слово и перевод, разделенные тире:
<code>hello - привет
world - мир
learning - изучение</code>

⚙️ <b>Настройки доступа:</b>
1. Откройте ваш Google Docs
2. Нажмите "Настроить доступ" 
3. Выберите "Просмотр могут все, у кого есть ссылка"

📎 <b>Поддерживаемые форматы ссылок:</b>
• Полная ссылка: docs.google.com/document/d/ID/edit
• Только ID документа: 1BxG7...xyz123

Отправьте ссылку следующим сообщением:`

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
    await bot.answerCallbackQuery(query.id)
    
    // Устанавливаем состояние ожидания ссылки
    userStates[chatId] = 'waiting_for_dictionary_url'
    return
  } else if (query.data === 'remove_custom_dictionary') {
    // Удаление пользовательского словаря
    const chatId = query.from.id
    const userDict = getUserDictionary(chatId)
    
    if (userDict) {
      removeUserDictionary(chatId)
      await bot.sendMessage(chatId, '✅ Ваш персональный словарь удален. Теперь используется словарь по умолчанию.')
    } else {
      await bot.sendMessage(chatId, 'ℹ️ У вас нет персонального словаря. Используется словарь по умолчанию.')
    }
    
    await bot.answerCallbackQuery(query.id)
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
    message += `🔄 Авторассылка: ${timerInfo.isActive ? 'активна' : 'неактивна'}\n\n`
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

  for (const userId of allChatIds) {
    // Если интервал не установлен, устанавливаем дефолтный
    let userInterval = getUserInterval(userId)
    if (!userInterval) {
      console.log(`[RESTART] Устанавливаем дефолтный интервал ${min} мин для userId=${userId}`)
      setUserInterval(userId, min)
    }
    
    const timerCallback = await createTimerCallback(userCurrentOriginal)
    createOrUpdateUserTimer(
      userId,
      bot,
      dictionary,
      { currentIndex: getUserIndex(userId) },
      timerCallback
    )
  }
  await bot.sendMessage(chatId, `✅ Перезапуск завершён. Активных таймеров: ${allChatIds.size}`)
})

// Функция для обработки запуска бота (используется и для /start и для кнопки)
async function handleStartCommand(chatId, bot) {
  console.log('Обработка запуска бота для chatId:', chatId)
  const dictionaryResult = await getDictionary(chatId)
  
  if (!dictionaryResult) {
    console.error('Не удалось получить словарь')
    await bot.sendMessage(chatId, 'Извините, произошла ошибка при загрузке словаря. Пожалуйста, попробуйте позже.', {
      reply_markup: startMenu
    })
    return
  }

  // Устанавливаем глобальный словарь для использования в других функциях
  dictionary = dictionaryResult.dictionary
  
  console.log(`Словарь успешно загружен. Количество слов: ${dictionary.length} (${dictionaryResult.isCustom ? 'пользовательский' : 'по умолчанию'})`)
  
  var photoPath = __dirname + '/media/logo.jpg'

  // Получаем интервал пользователя, если не установлен - устанавливаем дефолтный
  let userInterval = getUserInterval(chatId)
  if (!userInterval) {
    console.log(`[START] Устанавливаем дефолтный интервал ${min} мин для нового пользователя chatId=${chatId}`)
    setUserInterval(chatId, min)
    userInterval = min
  }
  const intervalText = `${userInterval} минут`
  
  var optionsMessage2 = {
    caption: `Catch the first word, the rest will be in ${intervalText}`,
    reply_markup: JSON.stringify(give_me_keyboard),
    contentType: 'image/jpeg', // явно указываем тип контента для фото
  }

  // Сначала отправляем меню
  await bot.sendMessage(chatId, 'Меню:', { reply_markup: startMenu })

  try {
    await bot.sendPhoto(chatId, photoPath, optionsMessage2)
    const nextIdx = await getNextUnlearnedIndexNew(chatId, (getUserIndex(chatId) || 0))
    setUserIndex(chatId, nextIdx)
    const result = await sendWordMessage(chatId, nextIdx, bot)
    if (result && result.leftWords !== undefined) {
      userCurrentOriginal[chatId] = result.leftWords
    } else {
      console.error('sendWordMessage returned invalid result:', result)
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
  for (const chatId of allChatIds) {
    // Получаем настройки пользователя
    let userInterval = getUserInterval(chatId)
    
    // Если интервал не установлен, устанавливаем дефолтный
    if (!userInterval) {
      console.log(`[AUTO] Устанавливаем дефолтный интервал ${min} мин для chatId=${chatId}`)
      setUserInterval(chatId, min)
      userInterval = min
    }
    
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
    logMsg += `⏱️ Интервал: ${userInterval} мин (${userInterval === min ? 'дефолт из constants' : 'пользовательский'})\n`;
    logMsg += `⏳ Авторассылка: ${timerInfo.isActive ? 'активна' : 'неактивна'}\n`;
    logMsg += `📚 Выучено слов: ${learnedWords.length}\n`;
    logMsg += `🔢 Индекс (user_progress): ${getUserIndex(chatId)}\n`;
    logMsg += `🕒 Период рассылки: ${userPeriod.start}:00-${userPeriod.end}:00 ${userPeriod.start === clockStart && userPeriod.end === clockEnd ? '(дефолт из constants)' : '(пользовательский)'}\n`;
    console.log(logMsg)
    console.log(`[AUTO] Запускаем таймер для chatId=${chatId}`)
    const timerCallback = await createTimerCallback(userCurrentOriginal)
    createOrUpdateUserTimer(
      chatId,
      bot,
      dictionary,
      { currentIndex: getUserIndex(chatId) },
      timerCallback
    )
  }
  console.log('[AUTO] Автоматический запуск таймеров завершён')
}

// Команда /start теперь вызывает функцию handleStartCommand
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  await handleStartCommand(chatId, bot)
})

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
  // === Обработка добавления пользовательского словаря ===
  if (userStates[msg.chat.id] === 'waiting_for_dictionary_url') {
    const chatId = msg.chat.id
    const url = msg.text.trim()
    
    await bot.sendMessage(chatId, '⏳ Проверяю ваш словарь...')
    
    try {
      const validation = await validateGoogleDocUrl(url)
      
      if (validation.valid) {
        await setUserDictionary(chatId, url)
        delete userStates[chatId]
        
        await bot.sendMessage(chatId, `✅ <b>Словарь успешно добавлен!</b>

📚 Ваш персональный словарь загружен
🔗 Ссылка: ${url}
📊 Найдено строк: ${validation.content.split('\n').length}

💡 Теперь бот будет использовать ваш словарь для отправки слов.`, { parse_mode: 'HTML' })
        
        // Показываем обновленную информацию о словаре
        setTimeout(async () => {
          const message = '📚 <b>Настройки словаря обновлены</b>\n\n✅ Используется ваш личный словарь'
          await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify(dictionarySettingsKeyboard)
          })
        }, 2000)
      } else {
        await bot.sendMessage(chatId, `❌ <b>Ошибка при добавлении словаря</b>

${validation.error}

📝 Попробуйте еще раз или обратитесь к инструкции.`, { parse_mode: 'HTML' })
      }
    } catch (error) {
      console.error('Ошибка при валидации словаря:', error)
      await bot.sendMessage(chatId, '❌ Произошла ошибка при проверке словаря. Попробуйте позже.')
      delete userStates[chatId]
    }
    return
  }

  // Обработка кнопки "🔂 Покажи новое слово"
  if (msg.text === '🔂 Покажи новое слово') {
    const chatId = msg.chat.id
    try {
      const nextIdx = await getNextUnlearnedIndexNew(chatId, getUserIndex(chatId) + 1)
      setUserIndex(chatId, nextIdx)
      const result = await sendWordMessage(chatId, nextIdx, bot)
      if (result && result.leftWords !== undefined) {
        userCurrentOriginal[chatId] = result.leftWords
      } else {
        console.error('sendWordMessage returned invalid result:', result)
        userCurrentOriginal[chatId] = ''
      }
    } catch (error) {
      console.error('Ошибка при отправке нового слова через кнопку:', error)
      await bot.sendMessage(chatId, 'Произошла ошибка при загрузке слова. Попробуйте позже.')
    }
    return
  }
  
  if (msg.text === 'ℹ️ Показать настройки') {
    const chatId = msg.chat.id
    const userInterval = getUserInterval(chatId)
    const timerInfo = getUserTimerInfo(chatId)
    const learnedWords = loadLearnedWords(chatId)
    const userIndex = getUserIndex(chatId)
    const userPeriod = getUserPeriod(chatId)

    let message = '🛠️ <b>Ваши настройки:</b>\n\n'
    message += `⏱️ Интервал: <b>${userInterval ? userInterval + ' мин (пользовательский)' : min + ' мин (по умолчанию)'}</b>\n`
    message += `⏳ Статус авторассылки: <b>${timerInfo.isActive ? 'активна' : 'неактивна'}</b>\n`
    message += `📚 Выучено слов: <b>${learnedWords.length}</b>\n`
    message += `🔢 Индекс (user_progress): <b>${userIndex}</b>\n`
    message += `🕒 Период рассылки: <b>${userPeriod.start}:00-${userPeriod.end}:00</b>\n\n`
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
  // === Обработка кнопки "📚 Настройки словаря" ===
  if (msg.text === '📚 Настройки словаря') {
    const chatId = msg.chat.id
    const userDict = getUserDictionary(chatId)
    let message = '📚 <b>Настройки словаря</b>\n\n'
    
    if (userDict) {
      message += '✅ Используется ваш личный словарь\n'
      message += `📎 Ссылка: ${userDict.url}\n`
      message += `📅 Добавлен: ${new Date(userDict.createdAt).toLocaleDateString('ru-RU')}`
    } else {
      message += '📖 Используется словарь по умолчанию\n'
      message += 'Вы можете добавить свой личный словарь из Google Docs'
    }
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: JSON.stringify(dictionarySettingsKeyboard)
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
