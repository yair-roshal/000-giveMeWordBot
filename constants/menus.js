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
    [{ text: '🔂 Покажи новое слово' }],
    
    [{ text: 'ℹ️ Показать настройки' }],

    [{ text: '⚙️ Настройки интервала' }, { text: '🛠️ Сменить период' }],

    [{ text: '📚 Настройки словаря' }],

    [{ text: '👥 Все пользователи' }, { text: '🗑️ Очистить кэш' }],

    [{ text: 'Закрыть' }],
  ],
  resize_keyboard: true,
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
        text: '🚀 Start Bot',
        callback_data: 'start_bot',
      },
    ],
  ],
}

const give_me_keyboard = {
  inline_keyboard: [
    [
      {
        text: '🔂 Покажи новое слово',
        callback_data: 'give_me',
      },
    ],
    [
      {
        text: '✅ Я выучил это слово',
        callback_data: 'mark_learned',
      },
    ],
    [
      {
        text: '📱 Открыть меню',
        callback_data: 'open_main_menu',
      },
    ],
  ],
}

// Меню для выбора интервала
const intervalSettingsKeyboard = {
  inline_keyboard: [
    [
      {
        text: '1 час',
        callback_data: 'interval_60',
      },
      {
        text: '2 часа',
        callback_data: 'interval_120',
      },
    ],
    [
      {
        text: '3 часа',
        callback_data: 'interval_180',
      },
      {
        text: '4 часа',
        callback_data: 'interval_240',
      },
    ],
    [
      {
        text: '5 часов',
        callback_data: 'interval_300',
      },
      {
        text: '6 часов',
        callback_data: 'interval_360',
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

// Меню настроек словаря
const dictionarySettingsKeyboard = {
  inline_keyboard: [
    [
      {
        text: '📖 Информация о словаре',
        callback_data: 'dictionary_info',
      },
    ],
    [
      {
        text: '📚 Выбрать словарь',
        callback_data: 'show_dictionary_list',
      },
    ],
    [
      {
        text: '➕ Добавить новый словарь',
        callback_data: 'add_custom_dictionary',
      },
    ],
    [
      {
        text: '🗑️ Удалить текущий словарь',
        callback_data: 'remove_custom_dictionary',
      },
    ],
    [
      {
        text: '🔄 Обнулить индекс',
        callback_data: 'reset_index',
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

function getHourKeyboard(prefix, min = -1) {
  const hours = []
  for (let h = min + 1; h <= 23; h++) {
    hours.push(h)
  }

  const rows = []

  const isEnd = prefix.startsWith('hour_end_')
  const startMatch = prefix.match(/^hour_end_(\d{1,2})$/)
  const start = isEnd && startMatch ? startMatch[1] : null

  for (let i = 0; i < hours.length; i += 4) {
    const row = []

    for (let j = 0; j < 4; j++) {
      const h = hours[i + j]

      if (h !== undefined) {
        const text = `${h}:00`
        let callback_data = isEnd && start !== null
          ? `he_${start}_${h}`
          : `${prefix}${h}`

        // Безопасность
        if (callback_data.length > 64) {
          callback_data = callback_data.slice(0, 64)
        }

        row.push({ text, callback_data })
      } else {
        // Добавим пустышку
        row.push({ text: ' ', callback_data: 'noop' })
      }
    }

    rows.push(row)
  }

  rows.push([{ text: '🔙 Назад', callback_data: 'back_to_main' }])

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
  dictionarySettingsKeyboard,
  getHourKeyboard,
}
