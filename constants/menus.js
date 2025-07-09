var start_keyboard = {
  inline_keyboard: [[{ text: '/start', callback_data: '/start' }]],
}
var keyboard = {
  inline_keyboard: [
    [
      { text: 'Yes', url: 'http://www.qqq.com/' },
      { text: 'No', url: 'http://www.qqq.com/' },
    ],
  ],
}

const startMenu = {
  keyboard: [
    [{ text: 'ℹ️ Показать настройки' }],

    [{ text: '⚙️ Настройки интервала' }, { text: '🛠️ Сменить период' }],

    [{ text: 'Закрыть' }],
  ],
  one_time_keyboard: true,
}

const mainMenu = {
  keyboard: [
    [
      [
        {
          text: 'Development',
          callback_data: 'development',
        },
        {
          text: 'Lifestyle',
          callback_data: 'lifestyle',
        },
      ],
      [
        {
          text: 'Other',
          callback_data: 'other',
        },
      ],
    ],
  ],
  // keyboard: [['Sample text', 'Second sample'], ['Keyboard'], ["I'm robot"]],
  resize_keyboard: true,
  one_time_keyboard: true,
  force_reply: true,
}

//===============================

const start_inline_keyboard = {
  inline_keyboard: [
    [
      {
        text: 'Start',
        callback_data: 'start',
      },
    ],
  ],
}

const give_me_keyboard = {
  inline_keyboard: [
    [
      {
        text: '🔂Покажи новое слово',
        callback_data: 'give_me',
      },
    ],
    [
      {
        text: '✅ Я выучил это слово',
        callback_data: 'mark_learned',
      },
    ],
  ],
}

// Меню для выбора интервала
const intervalSettingsKeyboard = {
  inline_keyboard: [
    [
      {
        text: '1 минута',
        callback_data: 'interval_1',
      },
      {
        text: '5 минут',
        callback_data: 'interval_5',
      },
    ],
    [
      {
        text: '10 минут',
        callback_data: 'interval_10',
      },
      {
        text: '15 минут',
        callback_data: 'interval_15',
      },
    ],
    [
      {
        text: '30 минут',
        callback_data: 'interval_30',
      },
      {
        text: '1 час',
        callback_data: 'interval_60',
      },
    ],
    [
      {
        text: '2 часа',
        callback_data: 'interval_120',
      },
      {
        text: '4 часа',
        callback_data: 'interval_240',
      },
    ],
    [
      {
        text: '🔙 Назад',
        callback_data: 'back_to_main',
      },
    ],
  ],
}

const periodSettingsKeyboard = {
  inline_keyboard: [
    [
      { text: 'Утро (6:00-12:00)', callback_data: 'period_6_12' },
      { text: 'День (12:00-18:00)', callback_data: 'period_12_18' },
    ],
    [
      { text: 'Вечер (18:00-23:00)', callback_data: 'period_18_23' },
      { text: 'Круглосуточно', callback_data: 'period_0_24' },
    ],
    [{ text: '🔙 Назад', callback_data: 'back_to_main' }],
  ],
}

function getHourKeyboard(prefix, min = -1) {
  // Собираем только часы больше min
  const hours = []
  for (let h = min + 1; h <= 23; h++) {
    hours.push(h)
  }
  // Разбиваем на ряды по 6
  const rows = []
  for (let i = 0; i < hours.length; i += 6) {
    rows.push(hours.slice(i, i + 6).map((h) => {
      // Если prefix начинается с 'hour_end_', сокращаем callback_data
      if (prefix.startsWith('hour_end_')) {
        const start = prefix.split('_')[2]
        return { text: `${h}:00`, callback_data: `he_${start}_${h}` }
      }
      return { text: `${h}:00`, callback_data: `${prefix}${h}` }
    }))
  }
  // Добавляем кнопку назад
  rows.push([{ text: '🔙 Назад', callback_data: 'back_to_main' }])
  // Для отладки
  console.log('getHourKeyboard rows:', JSON.stringify(rows))
  return {
    inline_keyboard: rows,
  }
}

module.exports = {
  startMenu,
  mainMenu,
  give_me_keyboard,
  start_inline_keyboard,
  keyboard,
  start_keyboard,
  intervalSettingsKeyboard,
  periodSettingsKeyboard,
  getHourKeyboard,
}
