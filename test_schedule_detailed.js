// Детальный тест: проверяем, что следующее сообщение планируется строго по расписанию,
// а не через интервал от текущего времени

function calculateNextSendTime(currentHour, currentMinute, intervalMinutes, start, end) {
  const sendTimes = []

  // Если интервал кратен 60 минутам (часам), отправляем строго в начале каждого часа
  if (intervalMinutes >= 60 && intervalMinutes % 60 === 0) {
    const intervalHours = intervalMinutes / 60
    for (let hour = start; hour < end; hour += intervalHours) {
      sendTimes.push({ hour, minute: 0 })
    }
  } else {
    let currentSendMinute = start * 60
    const endMinute = end * 60

    while (currentSendMinute < endMinute) {
      const hour = Math.floor(currentSendMinute / 60)
      const minute = currentSendMinute % 60
      sendTimes.push({ hour, minute })
      currentSendMinute += intervalMinutes
    }
  }

  // Текущее время в минутах от полуночи
  const nowMinutes = currentHour * 60 + currentMinute

  // Находим следующее время отправки
  let nextSendTime = null
  for (const time of sendTimes) {
    const sendTimeMinutes = time.hour * 60 + time.minute
    if (sendTimeMinutes > nowMinutes) {
      nextSendTime = time
      break
    }
  }

  // Если не нашли время сегодня, берем первое время завтра
  if (!nextSendTime) {
    nextSendTime = sendTimes[0]
    return { ...nextSendTime, isNextDay: true }
  }

  return { ...nextSendTime, isNextDay: false }
}

console.log('=== Тест: Интервал 120 минут, период 9:00-23:00 ===')
console.log('Расписание: 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00 (БЕЗ 23:00!)\n')

const testCases = [
  { time: '08:30', expected: '09:00' },
  { time: '09:00', expected: '11:00' }, // Сразу после отправки в 09:00
  { time: '09:45', expected: '11:00' }, // Случайное время между 09:00 и 11:00
  { time: '10:59', expected: '11:00' }, // За минуту до 11:00
  { time: '11:00', expected: '13:00' }, // Сразу после отправки в 11:00
  { time: '12:30', expected: '13:00' }, // Между 11:00 и 13:00
  { time: '15:45', expected: '17:00' }, // Между 15:00 и 17:00
  { time: '21:00', expected: '09:00 (завтра)' }, // Сразу после отправки в 21:00 - следующая завтра
  { time: '22:15', expected: '09:00 (завтра)' }, // После 21:00 уже завтра
  { time: '23:00', expected: '09:00 (завтра)' }, // 23:00 не входит в период
  { time: '23:30', expected: '09:00 (завтра)' }, // После 23:00
]

let allPassed = true

testCases.forEach(testCase => {
  const [hour, minute] = testCase.time.split(':').map(Number)
  const result = calculateNextSendTime(hour, minute, 120, 9, 23)

  const resultStr = result.isNextDay
    ? `${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')} (завтра)`
    : `${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')}`

  const passed = resultStr === testCase.expected
  const icon = passed ? '✅' : '❌'

  if (!passed) allPassed = false

  console.log(`${icon} Текущее время: ${testCase.time} -> Следующая отправка: ${resultStr} (ожидается: ${testCase.expected})`)
})

console.log(`\n${allPassed ? '✅ ВСЕ ТЕСТЫ ПРОШЛИ' : '❌ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОШЛИ'}`)
console.log('\n📌 ВЫВОД:')
console.log('   Следующее сообщение планируется СТРОГО по расписанию,')
console.log('   а НЕ через 120 минут от текущего времени!')
console.log('\n   Например: если сейчас 09:45, следующее сообщение будет в 11:00,')
console.log('   а не в 11:45 (09:45 + 120 минут).')
