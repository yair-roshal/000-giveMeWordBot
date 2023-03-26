const startMenu = {
    reply_markup: {
        keyboard: [
            [
                {
                    text: 'Main',
                },
                {
                    text: 'Description',
                },
            ],
            [
                {
                    text: 'Order bot development',
                    request_contact: true,
                },
            ],
            [
                {
                    text: 'About me',
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
