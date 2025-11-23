// Тестовый скрипт для проверки логики расписания
// Эмулирует функцию calculateNextSendTime с заданными параметрами

function testScheduleLogic(intervalMinutes, start, end) {
  const sendTimes = []

  // Если интервал кратен 60 минутам (часам), отправляем строго в начале каждого часа
  if (intervalMinutes >= 60 && intervalMinutes % 60 === 0) {
    const intervalHours = intervalMinutes / 60
    for (let hour = start; hour <= end; hour += intervalHours) {
      // Включаем час 'end', если он попадает в расписание
      if (hour <= end) {
        sendTimes.push({ hour, minute: 0 })
      }
    }
  } else {
    // Для интервалов меньше часа или не кратных часу, начинаем с start:00
    let currentSendMinute = start * 60 // Начинаем с начала периода в минутах от полуночи
    const endMinute = end * 60

    while (currentSendMinute < endMinute) {
      const hour = Math.floor(currentSendMinute / 60)
      const minute = currentSendMinute % 60
      sendTimes.push({ hour, minute })
      currentSendMinute += intervalMinutes
    }
  }

  return sendTimes
}

// Тестируем с интервалом 120 минут и периодом 9:00-23:00
console.log('=== Тест: Интервал 120 минут, период 9:00-23:00 ===')
const result = testScheduleLogic(120, 9, 23)
console.log('Времена отправки:')
result.forEach(time => {
  console.log(`  ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`)
})
console.log(`\nВсего отправок: ${result.length}`)
console.log('\nОжидаемые времена: 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00, 23:00')
console.log(`Результат: ${result.length === 8 ? '✅ PASS' : '❌ FAIL'}`)

// Дополнительные тесты
console.log('\n=== Тест: Интервал 60 минут, период 10:00-14:00 ===')
const result2 = testScheduleLogic(60, 10, 14)
console.log('Времена отправки:', result2.map(t => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`).join(', '))
console.log(`Ожидается: 10:00, 11:00, 12:00, 13:00, 14:00 (5 отправок)`)
console.log(`Результат: ${result2.length === 5 ? '✅ PASS' : '❌ FAIL'}`)

console.log('\n=== Тест: Интервал 30 минут, период 10:00-12:00 ===')
const result3 = testScheduleLogic(30, 10, 12)
console.log('Времена отправки:', result3.map(t => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`).join(', '))
console.log(`Ожидается: 10:00, 10:30, 11:00, 11:30 (4 отправки)`)
console.log(`Результат: ${result3.length === 4 ? '✅ PASS' : '❌ FAIL'}`)
