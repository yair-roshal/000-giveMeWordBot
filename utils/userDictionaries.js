// utils/userDictionaries.js
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const USER_DICTIONARIES_FILE = path.join(__dirname, '../data/user_dictionaries.json')

// Функция для загрузки пользовательских словарей
function loadUserDictionaries() {
  try {
    if (fs.existsSync(USER_DICTIONARIES_FILE)) {
      const data = fs.readFileSync(USER_DICTIONARIES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Ошибка при загрузке пользовательских словарей:', error)
  }
  return {}
}

// Функция для сохранения пользовательских словарей
function saveUserDictionaries(dictionaries) {
  try {
    fs.writeFileSync(USER_DICTIONARIES_FILE, JSON.stringify(dictionaries, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка при сохранении пользовательских словарей:', error)
    return false
  }
}

// Получить словарь пользователя
function getUserDictionary(chatId) {
  const dictionaries = loadUserDictionaries()
  return dictionaries[chatId] || null
}

// Установить пользовательский словарь
function setUserDictionary(chatId, dictionaryUrl) {
  const dictionaries = loadUserDictionaries()
  dictionaries[chatId] = {
    url: dictionaryUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  return saveUserDictionaries(dictionaries)
}

// Удалить пользовательский словарь (вернуться к умолчанию)
function removeUserDictionary(chatId) {
  const dictionaries = loadUserDictionaries()
  if (dictionaries[chatId]) {
    delete dictionaries[chatId]
    return saveUserDictionaries(dictionaries)
  }
  return true
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

module.exports = {
  loadUserDictionaries,
  saveUserDictionaries,
  getUserDictionary,
  setUserDictionary,
  removeUserDictionary,
  extractGoogleDocId,
  validateGoogleDocUrl,
  fetchUserDictionary
}
