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
    ],
}

module.exports = {
    startMenu,
    mainMenu,
    give_me_keyboard,
    start_inline_keyboard,
    keyboard,
    start_keyboard,
}
