module.exports = function formatDate(timestamp) {
    const date = new Date(timestamp)
    const day = date.getDate().toString().padStart(2, '0') // день месяца, например "01"
    const month = (date.getMonth() + 1).toString().padStart(2, '0') // номер месяца (от 0 до 11), например "01"
    const year = date.getFullYear() // год, например 2023
    const hours = date.getHours().toString().padStart(2, '0') // часы, например "01"
    const minutes = date.getMinutes().toString().padStart(2, '0') // минуты, например "01"
    const seconds = date.getSeconds().toString().padStart(2, '0') // секунды, например "01"
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}
