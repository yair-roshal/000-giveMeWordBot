const axios = require("axios")

module.exports = async function fetchGoogleDocText() {
  // Идентификатор документа (из ссылки)
  const documentId = "167xQkssbS9dBMwLBaU0jD7FTXrTqJYbzr7YBmh-OGk8"

  // URL для экспорта содержимого в формате текста
  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`

  try {
    // Делаем запрос к публичному документу
    const response = await axios.get(exportUrl)

    if (response.status === 200) {
      // Выводим содержимое документа
      // console.log("Document content:\n", response.data)
      return response.data
    } else {
      console.log(`Ошибка: статус ${response.status}`)
    }
  } catch (error) {
    console.error("Ошибка при запросе документа:", error.message)
  }
}
