var keyboard = {
    inline_keyboard: [
        [
            { text: 'Yes', url: 'http://www.google.com/' },
            { text: 'No', url: 'http://www.google.com/' },
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
                text: 'give me new words',
                callback_data: 'give_me',
            },
        ],
    ],
}

const give_me_keyboard = {
    inline_keyboard: [
        [
            {
                text: 'give me new words',
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
}
