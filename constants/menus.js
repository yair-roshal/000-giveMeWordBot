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
        [
            { text: 'ℹ️ Мои настройки' }
        ],
        [
            { text: 'Классика222' },
            { text: 'Закрыть' }
        ],
        [
            { text: 'Заказать разработку бота' },
            { text: 'Про автора' },
            { text: '⚙️ Настройки интервала' }
        ]
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
                text: 'give me new word',
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

module.exports = {
    startMenu,
    mainMenu,
    give_me_keyboard,
    start_inline_keyboard,
    keyboard,
    start_keyboard,
    intervalSettingsKeyboard,
}
