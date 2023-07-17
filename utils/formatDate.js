// module.exports = function formatDate(timestamp) {
//     // const offset = 2; // Israel is 2 hours ahead of UTC/GMT
//     const offset = 0; // Israel is 2 hours ahead of UTC/GMT
//     const date = new Date(timestamp + offset * 60 * 60 * 1000);
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0');
//     return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
// }

module.exports = function formatDate(timestamp, timezone = "Asia/Jerusalem") {
  try {
    const date = new Date(timestamp)

    // Устанавливаем часовой пояс
    const options = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
    const formattedDate = date.toLocaleString("en-GB", options)

    return formattedDate.replace(",", "")
  } catch (error) {
    console.error("Error formatting date:", error.message)
    return null
  }
}
