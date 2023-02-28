  
const startMenu = {
    reply_markup: {
        keyboard: [
            [
                {
                    text: 'Классика',
                },
                {
                    text: 'Закрыть',
                },
            ],
            [
                {
                    text: 'Заказать разработку бота',
                    request_contact: true,
                },
            ],
            [
                {
                    text: 'Про автора',
                },
            ],
        ],
        one_time_keyboard: true,
    },
}

const mainMenu = {
    reply_markup: {
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
    },
}

module.exports = [startMenu, mainMenu]
