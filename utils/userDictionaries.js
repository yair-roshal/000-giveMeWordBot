// utils/userDictionaries.js
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const USER_DICTIONARIES_FILE = path.join(__dirname, '../data/user_dictionaries.json')

// Инициализация файла словарей при первом запуске
function initUserDictionariesFile() {
  try {
    const dataDir = path.join(__dirname, '../data')
    const backupFile = USER_DICTIONARIES_FILE + '.backup'

    // Создаём папку data, если её нет
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('[INIT] Создана папка data')
    }

    // Создаём файл словарей, если его нет
    if (!fs.existsSync(USER_DICTIONARIES_FILE)) {
      // Пробуем восстановить из бэкапа
      if (fs.existsSync(backupFile)) {
        const backupContent = fs.readFileSync(backupFile, 'utf8').trim()
        try {
          JSON.parse(backupContent)
          fs.writeFileSync(USER_DICTIONARIES_FILE, backupContent, 'utf8')
          console.log('[INIT] Файл user_dictionaries.json восстановлен из backup')
          return
        } catch (e) {
          console.log('[INIT] Backup содержит невалидный JSON')
        }
      }
      fs.writeFileSync(USER_DICTIONARIES_FILE, '{}', 'utf8')
      console.log('[INIT] Создан файл user_dictionaries.json')
    } else {
      // Проверяем, что файл не пустой и содержит валидный JSON
      const content = fs.readFileSync(USER_DICTIONARIES_FILE, 'utf8').trim()
      if (!content || content === '' || content === '{}') {
        // Файл пустой, пробуем восстановить из бэкапа
        if (fs.existsSync(backupFile)) {
          const backupContent = fs.readFileSync(backupFile, 'utf8').trim()
          try {
            const parsed = JSON.parse(backupContent)
            if (Object.keys(parsed).length > 0) {
              fs.writeFileSync(USER_DICTIONARIES_FILE, backupContent, 'utf8')
              console.log(`[INIT] Восстановлено ${Object.keys(parsed).length} пользователей из backup`)
              return
            }
          } catch (e) {
            console.log('[INIT] Backup содержит невалидный JSON')
          }
        }
        if (!content || content === '') {
          fs.writeFileSync(USER_DICTIONARIES_FILE, '{}', 'utf8')
          console.log('[INIT] Файл user_dictionaries.json был пустым, инициализирован')
        }
      } else {
        try {
          const parsed = JSON.parse(content)
          console.log(`[INIT] Файл user_dictionaries.json загружен, пользователей: ${Object.keys(parsed).length}`)
        } catch (e) {
          console.error('[INIT] Файл user_dictionaries.json содержит невалидный JSON')
          // Пробуем восстановить из бэкапа
          if (fs.existsSync(backupFile)) {
            const backupContent = fs.readFileSync(backupFile, 'utf8').trim()
            try {
              JSON.parse(backupContent)
              fs.writeFileSync(USER_DICTIONARIES_FILE, backupContent, 'utf8')
              console.log('[INIT] Восстановлено из backup после ошибки JSON')
              return
            } catch (e2) {
              console.log('[INIT] Backup тоже невалидный')
            }
          }
          // Сохраняем бэкап повреждённого файла и сбрасываем
          const corruptBackup = USER_DICTIONARIES_FILE + '.corrupt.' + Date.now()
          fs.writeFileSync(corruptBackup, content, 'utf8')
          fs.writeFileSync(USER_DICTIONARIES_FILE, '{}', 'utf8')
          console.log('[INIT] Сброс после невалидного JSON')
        }
      }
    }
  } catch (error) {
    console.error('[INIT] Ошибка при инициализации файла словарей:', error)
  }
}

// Инициализируем файл при загрузке модуля
initUserDictionariesFile()

// Функция для загрузки пользовательских словарей
function loadUserDictionaries() {
  try {
    if (fs.existsSync(USER_DICTIONARIES_FILE)) {
      const data = fs.readFileSync(USER_DICTIONARIES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      console.log(`[LOAD] Загружено словарей пользователей: ${Object.keys(parsed).length}`)
      return parsed
    }
  } catch (error) {
    console.error('Ошибка при загрузке пользовательских словарей:', error)
  }
  return {}
}

// Функция для сохранения пользовательских словарей
function saveUserDictionaries(dictionaries) {
  try {
    const jsonData = JSON.stringify(dictionaries, null, 2)

    // Создаём резервную копию перед записью (если файл существует и не пустой)
    if (fs.existsSync(USER_DICTIONARIES_FILE)) {
      const existingContent = fs.readFileSync(USER_DICTIONARIES_FILE, 'utf8').trim()
      if (existingContent && existingContent !== '{}') {
        const backupFile = USER_DICTIONARIES_FILE + '.backup'
        fs.writeFileSync(backupFile, existingContent, 'utf8')
      }
    }

    fs.writeFileSync(USER_DICTIONARIES_FILE, jsonData, 'utf8')
    console.log(`[SAVE] Сохранено словарей пользователей: ${Object.keys(dictionaries).length}`)
    return true
  } catch (error) {
    console.error('Ошибка при сохранении пользовательских словарей:', error)
    return false
  }
}

// Миграция старого формата (один словарь) в новый (список словарей)
function migrateUserData(userData) {
  if (!userData) return { dictionaries: [], activeIndex: -1 }
  
  // Если уже новый формат
  if (Array.isArray(userData.dictionaries)) {
    return userData
  }
  
  // Старый формат - один словарь напрямую
  if (userData.url) {
    return {
      dictionaries: [userData],
      activeIndex: 0
    }
  }
  
  return { dictionaries: [], activeIndex: -1 }
}

// Получить активный словарь пользователя
function getUserDictionary(chatId) {
  const dictionaries = loadUserDictionaries()
  const userData = migrateUserData(dictionaries[chatId])
  
  if (userData.activeIndex >= 0 && userData.activeIndex < userData.dictionaries.length) {
    return userData.dictionaries[userData.activeIndex]
  }
  return null
}

// Получить список всех словарей пользователя
function getUserDictionaryList(chatId) {
  const dictionaries = loadUserDictionaries()
  const userData = migrateUserData(dictionaries[chatId])
  return {
    dictionaries: userData.dictionaries || [],
    activeIndex: userData.activeIndex ?? -1
  }
}

// Установить пользовательский словарь (добавляет в список или обновляет существующий)
async function setUserDictionary(chatId, dictionaryUrl) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])

  // Получаем название документа
  let title = 'Пользовательский словарь'
  let wordCount = 0
  const docId = extractGoogleDocId(dictionaryUrl)

  try {
    if (docId) {
      title = await getGoogleDocTitle(docId)

      // Получаем содержимое для подсчета слов
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
      const response = await axios.get(exportUrl, { timeout: 15000 })
      if (response.data && typeof response.data === 'string') {
        const lines = response.data.split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('🇮🇱') && !line.startsWith('___'))
          .filter(line => {
            const hasValidSeparator = ['-', '—', '–', '—', '−'].some(sep => line.includes(sep))
            return hasValidSeparator
          })
        wordCount = lines.length
      }
    }
  } catch (error) {
    console.error(`Ошибка получения данных при добавлении словаря для ${chatId}:`, error.message)
  }

  const newDict = {
    url: dictionaryUrl,
    docId: docId,
    title: title,
    wordCount: wordCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Проверяем, есть ли уже такой словарь (по docId)
  const existingIndex = userData.dictionaries.findIndex(d => d.docId === docId || d.url === dictionaryUrl)
  
  if (existingIndex >= 0) {
    // Обновляем существующий словарь
    userData.dictionaries[existingIndex] = {
      ...userData.dictionaries[existingIndex],
      ...newDict,
      createdAt: userData.dictionaries[existingIndex].createdAt // сохраняем оригинальную дату создания
    }
    userData.activeIndex = existingIndex
  } else {
    // Добавляем новый словарь
    userData.dictionaries.push(newDict)
    userData.activeIndex = userData.dictionaries.length - 1
  }

  allDictionaries[chatId] = userData
  return saveUserDictionaries(allDictionaries)
}

// Выбрать словарь из списка по индексу
function selectUserDictionary(chatId, index) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  
  if (index >= 0 && index < userData.dictionaries.length) {
    userData.activeIndex = index
    allDictionaries[chatId] = userData
    return saveUserDictionaries(allDictionaries)
  }
  return false
}

// Удалить текущий активный словарь
function removeUserDictionary(chatId) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  
  if (userData.activeIndex >= 0 && userData.activeIndex < userData.dictionaries.length) {
    userData.dictionaries.splice(userData.activeIndex, 1)
    
    // Корректируем activeIndex после удаления
    if (userData.dictionaries.length === 0) {
      userData.activeIndex = -1
    } else if (userData.activeIndex >= userData.dictionaries.length) {
      userData.activeIndex = userData.dictionaries.length - 1
    }
    
    allDictionaries[chatId] = userData
    return saveUserDictionaries(allDictionaries)
  }
  return true
}

// Удалить словарь по индексу
function removeUserDictionaryByIndex(chatId, index) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  
  if (index >= 0 && index < userData.dictionaries.length) {
    userData.dictionaries.splice(index, 1)
    
    // Корректируем activeIndex
    if (userData.dictionaries.length === 0) {
      userData.activeIndex = -1
    } else if (userData.activeIndex === index) {
      // Если удалили активный словарь, выбираем предыдущий или первый
      userData.activeIndex = Math.max(0, index - 1)
    } else if (userData.activeIndex > index) {
      // Если удалили словарь до активного, сдвигаем индекс
      userData.activeIndex--
    }
    
    allDictionaries[chatId] = userData
    return saveUserDictionaries(allDictionaries)
  }
  return false
}

// Вернуться к словарю по умолчанию (деактивировать пользовательский)
function deactivateUserDictionary(chatId) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  
  userData.activeIndex = -1
  allDictionaries[chatId] = userData
  return saveUserDictionaries(allDictionaries)
}

// Извлечь ID документа из Google Docs URL
function extractGoogleDocId(url) {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /docs\.google\.com\/.*\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/  // Если передан только ID
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

// Валидация Google Docs URL/ID
async function validateGoogleDocUrl(url) {
  const docId = extractGoogleDocId(url)
  if (!docId) {
    return { valid: false, error: 'Неверный формат ссылки или ID документа' }
  }
  
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
  
  try {
    const response = await axios.get(exportUrl, { 
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 400
      }
    })
    
    if (!response.data || typeof response.data !== 'string') {
      return { valid: false, error: 'Документ пуст или недоступен' }
    }
    
    if (response.data.trim().length === 0) {
      return { valid: false, error: 'Документ не содержит текста' }
    }
    
    return { valid: true, docId, content: response.data }
  } catch (error) {
    console.error('Ошибка валидации Google Doc:', error.message)
    
    if (error.response?.status === 404) {
      return { valid: false, error: 'Документ не найден. Проверьте ссылку и права доступа.' }
    } else if (error.response?.status === 403) {
      return { valid: false, error: 'Нет доступа к документу. Сделайте документ доступным по ссылке.' }
    } else if (error.code === 'ECONNABORTED') {
      return { valid: false, error: 'Превышено время ожидания. Попробуйте позже.' }
    }
    
    return { valid: false, error: 'Ошибка при проверке документа. Попробуйте позже.' }
  }
}

// Получить название Google Doc
async function getGoogleDocTitle(docId) {
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`
  
  try {
    const response = await axios.get(docUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (response.data && typeof response.data === 'string') {
      // Ищем title в HTML
      const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        // Убираем " - Google Docs" из конца
        let title = titleMatch[1].replace(/\s*-\s*Google\s+Docs$/i, '').trim()
        if (title) {
          return title
        }
      }
    }
    
    return 'Пользовательский словарь'
  } catch (error) {
    console.error(`Ошибка получения названия документа ${docId}:`, error.message)
    return 'Пользовательский словарь'
  }
}

// Загрузить содержимое пользовательского словаря
async function fetchUserDictionary(chatId) {
  const userDict = getUserDictionary(chatId)
  if (!userDict) {
    return null
  }
  
  const docId = extractGoogleDocId(userDict.url)
  if (!docId) {
    console.error(`Неверный ID документа для пользователя ${chatId}:`, userDict.url)
    return null
  }
  
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
  
  try {
    const response = await axios.get(exportUrl, { 
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 400
      }
    })
    
    if (response.data && typeof response.data === 'string' && response.data.trim().length > 0) {
      return response.data
    }
    
    console.error(`Пустой или неверный контент словаря для пользователя ${chatId}`)
    return null
  } catch (error) {
    console.error(`Ошибка загрузки пользовательского словаря для ${chatId}:`, error.message)
    return null
  }
}

// Обновить количество слов в словаре пользователя
function updateUserDictionaryWordCount(chatId, newWordCount) {
  const allDictionaries = loadUserDictionaries()
  if (!allDictionaries[chatId]) {
    return false
  }

  const userData = allDictionaries[chatId]

  // Проверяем формат данных
  if (Array.isArray(userData.dictionaries)) {
    // Новый формат - обновляем активный словарь в массиве
    const activeIndex = userData.activeIndex ?? -1
    if (activeIndex >= 0 && activeIndex < userData.dictionaries.length) {
      userData.dictionaries[activeIndex].wordCount = newWordCount
      userData.dictionaries[activeIndex].updatedAt = new Date().toISOString()
    }
  } else {
    // Старый формат - обновляем напрямую
    userData.wordCount = newWordCount
    userData.updatedAt = new Date().toISOString()
  }

  return saveUserDictionaries(allDictionaries)
}

// Создать inline-клавиатуру для выбора словаря
function getDictionarySelectionKeyboard(chatId) {
  const userData = getUserDictionaryList(chatId)
  const keyboard = []
  
  userData.dictionaries.forEach((dict, index) => {
    const isActive = index === userData.activeIndex
    const emoji = isActive ? '✅ ' : '📖 '
    const shortTitle = dict.title.length > 25 ? dict.title.substring(0, 22) + '...' : dict.title
    const wordsInfo = dict.wordCount ? ` (${dict.wordCount})` : ''
    
    keyboard.push([{
      text: `${emoji}${shortTitle}${wordsInfo}`,
      callback_data: `select_dict_${index}`
    }])
  })
  
  // Кнопка для использования словаря по умолчанию
  const isDefault = userData.activeIndex === -1
  keyboard.push([{
    text: `${isDefault ? '✅ ' : '📖 '}Словарь по умолчанию`,
    callback_data: 'select_dict_default'
  }])
  
  // Кнопка добавления нового словаря
  keyboard.push([{
    text: '➕ Добавить новый словарь',
    callback_data: 'add_custom_dictionary'
  }])
  
  // Кнопка назад
  keyboard.push([{
    text: '🔙 Назад',
    callback_data: 'back_to_main'
  }])
  
  return { inline_keyboard: keyboard }
}

module.exports = {
  loadUserDictionaries,
  saveUserDictionaries,
  getUserDictionary,
  getUserDictionaryList,
  setUserDictionary,
  selectUserDictionary,
  removeUserDictionary,
  removeUserDictionaryByIndex,
  deactivateUserDictionary,
  extractGoogleDocId,
  validateGoogleDocUrl,
  fetchUserDictionary,
  getGoogleDocTitle,
  updateUserDictionaryWordCount,
  getDictionarySelectionKeyboard
}
