const axios = require("axios")

// Конфигурация для axios
const axiosConfig = {
  timeout: 30000, // увеличиваем таймаут до 30 секунд
  maxRetries: 3, // количество попыток
  retryDelay: 1000, // задержка между попытками в миллисекундах
}

// Функция для задержки
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Функция для выполнения запроса с повторными попытками
async function makeRequestWithRetry(url, retries = axiosConfig.maxRetries) {
  try {
    console.log(`Попытка запроса к Google Docs (осталось попыток: ${retries})`)
    const response = await axios.get(url, { 
      timeout: axiosConfig.timeout,
      maxRedirects: 5, // разрешаем до 5 редиректов
      validateStatus: function (status) {
        return status >= 200 && status < 400; // принимаем статусы 2xx и 3xx
      }
    })
    
    if (!response.data) {
      throw new Error('Пустой ответ от Google Docs')
    }
    
    return response
  } catch (error) {
    console.error('Ошибка при запросе к Google Docs:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.message.includes('socket hang up'))) {
      console.log(`Попытка запроса не удалась, осталось попыток: ${retries - 1}`)
      await delay(axiosConfig.retryDelay)
      return makeRequestWithRetry(url, retries - 1)
    }
    throw error
  }
}

module.exports = async function fetchGoogleDocText() {
  // Идентификатор документа (из ссылки)
  const documentId = "167xQkssbS9dBMwLBaU0jD7FTXrTqJYbzr7YBmh-OGk8"

  // URL для экспорта содержимого в формате текста
  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`

  try {
    console.log('Начинаю загрузку словаря из Google Docs...')
    const response = await makeRequestWithRetry(exportUrl)

    if (response.status === 200) {
      const content = response.data
      
      if (!content || typeof content !== 'string') {
        throw new Error('Неверный формат данных от Google Docs')
      }
      
      // Проверяем, что контент не пустой
      if (content.trim().length === 0) {
        throw new Error('Получен пустой словарь из Google Docs')
      }
      
      console.log('Словарь успешно загружен из Google Docs')
      return content
    } else {
      console.error(`Ошибка: статус ${response.status}`)
      return null
    }
  } catch (error) {
    console.error("Ошибка при запросе документа:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    return null
  }
}
