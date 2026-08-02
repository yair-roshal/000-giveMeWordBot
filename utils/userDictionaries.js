// utils/userDictionaries.js
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const USER_DICTIONARIES_FILE = path.join(__dirname, '../data/user_dictionaries.json')

// Подсчёт валидных строк словаря той же логикой, что и при реальной отправке слов.
// Ленивый require разрывает циклическую зависимость с getDictionary.js
// (getDictionary.js импортирует функции из этого модуля).
function countDictionaryLines(text) {
  if (!text || typeof text !== 'string') return 0
  const { parseDictionaryText } = require('./getDictionary')
  return parseDictionaryText(text).length
}

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

// Миграция старого формата в новый.
// Новый формат поддерживает множественный выбор:
//   dictionaries: [...],           // список личных словарей
//   selectedIndices: [0, 2],       // индексы выбранных личных словарей (чекбоксы)
//   includeDefault: true,          // включён ли словарь по умолчанию
//   activeIndex: number            // сохраняется для обратной совместимости
function migrateUserData(userData) {
  if (!userData) {
    return { dictionaries: [], activeIndex: -1, selectedIndices: [], includeDefault: true }
  }

  let migrated

  // Уже новый формат со списком словарей
  if (Array.isArray(userData.dictionaries)) {
    migrated = { ...userData }
  } else if (userData.url) {
    // Старый формат - один словарь напрямую
    migrated = {
      dictionaries: [userData],
      activeIndex: 0
    }
  } else {
    migrated = { dictionaries: [], activeIndex: -1 }
  }

  const activeIndex = migrated.activeIndex ?? -1

  // Если поле множественного выбора ещё не задано - выводим его из activeIndex
  if (!Array.isArray(migrated.selectedIndices)) {
    if (activeIndex >= 0 && activeIndex < migrated.dictionaries.length) {
      // Раньше был выбран один личный словарь
      migrated.selectedIndices = [activeIndex]
      migrated.includeDefault =
        typeof migrated.includeDefault === 'boolean' ? migrated.includeDefault : false
    } else {
      // Раньше использовался словарь по умолчанию
      migrated.selectedIndices = []
      migrated.includeDefault =
        typeof migrated.includeDefault === 'boolean' ? migrated.includeDefault : true
    }
  } else {
    // Чистим индексы, вышедшие за границы (например, после удаления словаря)
    migrated.selectedIndices = migrated.selectedIndices.filter(
      i => Number.isInteger(i) && i >= 0 && i < migrated.dictionaries.length
    )
    if (typeof migrated.includeDefault !== 'boolean') {
      migrated.includeDefault = migrated.selectedIndices.length === 0
    }
  }

  // Режим порядка слов (по умолчанию - последовательный)
  if (!['sequential', 'interleave', 'shuffle'].includes(migrated.wordOrder)) {
    migrated.wordOrder = 'sequential'
  }

  return migrated
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
    activeIndex: userData.activeIndex ?? -1,
    selectedIndices: userData.selectedIndices || [],
    includeDefault: userData.includeDefault !== false
  }
}

// Получить список выбранных словарей (для формирования итогового набора слов)
function getSelectedDictionaries(chatId) {
  const dictionaries = loadUserDictionaries()
  const userData = migrateUserData(dictionaries[chatId])

  const selected = (userData.selectedIndices || [])
    .filter(i => i >= 0 && i < userData.dictionaries.length)
    .map(i => userData.dictionaries[i])

  return {
    dictionaries: selected,
    includeDefault: userData.includeDefault !== false
  }
}

// Переключить (вкл/выкл) выбор личного словаря по индексу
function toggleDictionarySelection(chatId, index) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])

  if (index < 0 || index >= userData.dictionaries.length) {
    return false
  }

  const pos = userData.selectedIndices.indexOf(index)
  if (pos >= 0) {
    userData.selectedIndices.splice(pos, 1)
  } else {
    userData.selectedIndices.push(index)
    userData.selectedIndices.sort((a, b) => a - b)
  }

  allDictionaries[chatId] = userData
  return saveUserDictionaries(allDictionaries)
}

// Переключить (вкл/выкл) словарь по умолчанию
function toggleDefaultSelection(chatId) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])

  userData.includeDefault = !(userData.includeDefault !== false)

  allDictionaries[chatId] = userData
  return saveUserDictionaries(allDictionaries)
}

// Допустимые режимы порядка слов при нескольких выбранных словарях
const WORD_ORDER_MODES = ['sequential', 'interleave', 'shuffle']
const DEFAULT_WORD_ORDER = 'sequential'

// Получить режим порядка слов пользователя
function getWordOrder(chatId) {
  const dictionaries = loadUserDictionaries()
  const userData = migrateUserData(dictionaries[chatId])
  const mode = userData.wordOrder
  return WORD_ORDER_MODES.includes(mode) ? mode : DEFAULT_WORD_ORDER
}

// Установить режим порядка слов
function setWordOrder(chatId, mode) {
  if (!WORD_ORDER_MODES.includes(mode)) {
    return false
  }
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  userData.wordOrder = mode
  allDictionaries[chatId] = userData
  return saveUserDictionaries(allDictionaries)
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

      // Получаем содержимое для подсчета слов.
      // Считаем той же логикой, что и при реальной отправке слов
      // (единый источник правды - parseDictionaryText из getDictionary.js),
      // чтобы число в меню совпадало с фактическим количеством слов.
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
      const response = await axios.get(exportUrl, { timeout: 15000 })
      if (response.data && typeof response.data === 'string') {
        wordCount = countDictionaryLines(response.data)
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
  
  let targetIndex
  if (existingIndex >= 0) {
    // Обновляем существующий словарь
    userData.dictionaries[existingIndex] = {
      ...userData.dictionaries[existingIndex],
      ...newDict,
      createdAt: userData.dictionaries[existingIndex].createdAt // сохраняем оригинальную дату создания
    }
    targetIndex = existingIndex
  } else {
    // Добавляем новый словарь
    userData.dictionaries.push(newDict)
    targetIndex = userData.dictionaries.length - 1
  }

  // Сохраняем activeIndex для обратной совместимости
  userData.activeIndex = targetIndex

  // Автоматически отмечаем добавленный словарь как выбранный (чекбокс)
  if (!Array.isArray(userData.selectedIndices)) {
    userData.selectedIndices = []
  }
  if (!userData.selectedIndices.includes(targetIndex)) {
    userData.selectedIndices.push(targetIndex)
    userData.selectedIndices.sort((a, b) => a - b)
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
    const removedIndex = userData.activeIndex
    userData.dictionaries.splice(removedIndex, 1)

    // Корректируем activeIndex после удаления
    if (userData.dictionaries.length === 0) {
      userData.activeIndex = -1
    } else if (userData.activeIndex >= userData.dictionaries.length) {
      userData.activeIndex = userData.dictionaries.length - 1
    }

    userData.selectedIndices = adjustSelectedAfterRemoval(userData.selectedIndices, removedIndex)

    allDictionaries[chatId] = userData
    return saveUserDictionaries(allDictionaries)
  }
  return true
}

// Пересчёт выбранных индексов после удаления словаря по индексу removedIndex
function adjustSelectedAfterRemoval(selectedIndices, removedIndex) {
  if (!Array.isArray(selectedIndices)) return []
  return selectedIndices
    .filter(i => i !== removedIndex)
    .map(i => (i > removedIndex ? i - 1 : i))
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

    userData.selectedIndices = adjustSelectedAfterRemoval(userData.selectedIndices, index)

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

// Загрузить содержимое одного словаря по его url/docId
async function fetchDictionaryText(dictionary) {
  const docId = extractGoogleDocId(dictionary.url)
  if (!docId) {
    console.error(`Неверный ID документа для словаря "${dictionary.title}":`, dictionary.url)
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

    console.error(`Пустой или неверный контент словаря "${dictionary.title}"`)
    return null
  } catch (error) {
    console.error(`Ошибка загрузки словаря "${dictionary.title}":`, error.message)
    return null
  }
}

// Загрузить содержимое всех выбранных пользователем личных словарей.
// Возвращает массив { title, text } (только успешно загруженные).
async function fetchSelectedDictionaries(chatId) {
  const { dictionaries } = getSelectedDictionaries(chatId)
  if (!dictionaries.length) {
    return []
  }

  const results = await Promise.all(
    dictionaries.map(async dict => {
      const text = await fetchDictionaryText(dict)
      return text ? { title: dict.title, text } : null
    })
  )

  return results.filter(Boolean)
}

// Загрузить содержимое пользовательского словаря (обратная совместимость -
// возвращает объединённый текст всех выбранных личных словарей)
async function fetchUserDictionary(chatId) {
  const loaded = await fetchSelectedDictionaries(chatId)
  if (!loaded.length) {
    return null
  }
  return loaded.map(d => d.text).join('\n')
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

// Пересчитать количество слов во всех личных словарях пользователя, подтянув
// актуальный текст из Google Docs, и обновить кэш wordCount в хранилище.
// Возвращает Map: index -> актуальное число слов (для строк, что удалось загрузить).
// При ошибке сети конкретный словарь пропускается (используется старый кэш).
async function refreshUserDictionaryCounts(chatId) {
  const allDictionaries = loadUserDictionaries()
  const userData = migrateUserData(allDictionaries[chatId])
  const counts = new Map()
  let changed = false

  await Promise.all(
    userData.dictionaries.map(async (dict, index) => {
      const text = await fetchDictionaryText(dict)
      if (text == null) return // сеть недоступна - оставляем закэшированное число
      const count = countDictionaryLines(text)
      counts.set(index, count)
      if (dict.wordCount !== count) {
        dict.wordCount = count
        dict.updatedAt = new Date().toISOString()
        changed = true
      }
    })
  )

  if (changed) {
    allDictionaries[chatId] = userData
    saveUserDictionaries(allDictionaries)
  }

  return counts
}

// Создать inline-клавиатуру для выбора словарей (чекбоксами).
// Можно отметить несколько личных словарей и/или словарь по умолчанию -
// слова будут браться из всех отмеченных.
//
// refresh=true (по умолчанию) - подтягивает актуальный текст словарей из
// Google Docs и показывает live-число строк (обновляя кэш). Так меню всегда
// согласовано с реальным словарём. При переключении чекбоксов передавайте
// refresh=false, чтобы не дёргать сеть на каждый клик.
async function getDictionarySelectionKeyboard(chatId, refresh = true) {
  const userData = getUserDictionaryList(chatId)
  const selected = userData.selectedIndices || []
  const keyboard = []

  // Актуальные числа строк (live) - только при refresh
  let liveCounts = null
  if (refresh) {
    try {
      liveCounts = await refreshUserDictionaryCounts(chatId)
    } catch (error) {
      console.error(`Ошибка обновления числа слов для ${chatId}:`, error.message)
    }
  }

  // Словарь по умолчанию (тоже с чекбоксом)
  keyboard.push([{
    text: `${userData.includeDefault ? '☑️' : '⬜️'} 📖 Словарь по умолчанию`,
    callback_data: 'toggle_dict_default'
  }])

  // Личные словари пользователя
  userData.dictionaries.forEach((dict, index) => {
    const isChecked = selected.includes(index)
    const checkbox = isChecked ? '☑️' : '⬜️'
    const shortTitle = dict.title.length > 22 ? dict.title.substring(0, 19) + '...' : dict.title
    // Приоритет: свежее live-число, иначе закэшированное
    const count = liveCounts && liveCounts.has(index) ? liveCounts.get(index) : dict.wordCount
    const wordsInfo = count ? ` (${count})` : ''

    keyboard.push([{
      text: `${checkbox} 📚 ${shortTitle}${wordsInfo}`,
      callback_data: `toggle_dict_${index}`
    }])
  })

  // Кнопка применения выбора
  keyboard.push([{
    text: '💾 Применить выбор',
    callback_data: 'apply_dict_selection'
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
  getSelectedDictionaries,
  toggleDictionarySelection,
  toggleDefaultSelection,
  getWordOrder,
  setWordOrder,
  WORD_ORDER_MODES,
  setUserDictionary,
  selectUserDictionary,
  removeUserDictionary,
  removeUserDictionaryByIndex,
  deactivateUserDictionary,
  extractGoogleDocId,
  validateGoogleDocUrl,
  fetchUserDictionary,
  fetchSelectedDictionaries,
  getGoogleDocTitle,
  updateUserDictionaryWordCount,
  refreshUserDictionaryCounts,
  getDictionarySelectionKeyboard
}
