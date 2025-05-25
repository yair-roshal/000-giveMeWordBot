const axios = require("axios")

// Конфигурация для axios
const axiosConfig = {
  timeout: 10000, // 10 секунд таймаут
  maxRetries: 3, // количество попыток
  retryDelay: 1000, // задержка между попытками в миллисекундах
}

// Функция для задержки
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Функция для выполнения запроса с повторными попытками
async function makeRequestWithRetry(url, retries = axiosConfig.maxRetries) {
  try {
    const response = await axios.get(url, { timeout: axiosConfig.timeout })
    return response
  } catch (error) {
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
    const response = await makeRequestWithRetry(exportUrl)

    if (response.status === 200) {
      // Выводим содержимое документа
      // console.log("Document content:\n", response.data)
      return response.data
    } else {
      console.log(`Ошибка: статус ${response.status}`)
      return null
    }
  } catch (error) {
    console.error("Ошибка при запросе документа:", error.message)
    // Возвращаем null в случае ошибки, чтобы приложение могло продолжить работу
    return null
  }
}
