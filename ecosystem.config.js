module.exports = {
    apps: [
        {
            name: 'give_me_word_bot',
            script: './server.js',
            max_memory_restart: '300M',
            // Logging
            out_file: './give_me_word_bot_out.log',
            error_file: './give_me_word_bot_error.log',
            // merge_logs: true,
            time: false,

            log_date_format: 'YYYY-MM-DD_HH:mm:ss',
            // log_type: 'json',

            watch: false, // Отключаем watch чтобы избежать лишних перезапусков

            ignore_watch: [
                './node_modules',
                './.DS_Store',
                './package.json',
                './yarn.lock',
                '*.log',
                '**/*.log',
                '*.txt',
                '**/*.txt',
                'newBot-out.log',
                'newBot-error.log',
                'data/cache_allWords.txt',
                '**/cache_allWords.txt',
                '**/mnemonicsCache.json',
                'data/user_settings.json',
                '**/user_settings.json'
            ],

            // Env Specific Config
            env_prod: {
                NODE_ENV: 'prod',
                exec_mode: 'fork', // Используем fork вместо cluster для Telegram бота
                instances: 1, // Только один экземпляр для избежания конфликтов
                TZ: 'Asia/Jerusalem', // Временная зона Израиля
            },
            env_dev: {
                NODE_ENV: 'dev',
                TZ: 'Asia/Jerusalem', // Временная зона Израиля
            },
        },
    ],
}
