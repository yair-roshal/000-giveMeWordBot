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
            time: true,

            log_date_format: 'DD-MM-YYYY HH:mm:ss',
            // log_type: 'json',

            watch: true,

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
                exec_mode: 'cluster',
                instances: 'max',
            },
            env_dev: {
                NODE_ENV: 'dev',
            },
        },
    ],
}
