module.exports = {
    apps: [
        {
            name: 'engBot',
            script: 'server.js',
            watch: true,
            ignore_watch: [
                'data/**',
                '*.txt',
                'data/',
                'data/cache_allWords.txt',
                'node_modules',
            ],

            watch_delay: 1000,

            watch_options: {
                ignored: 'data/**',
            },
        },
    ],
}

//   {
// 	name   : "app1",
// 	script : "./app.js",
// 	env_production: {
// 	   NODE_ENV: "production"
// 	},
// 	env_development: {
// 	   NODE_ENV: "development"
// 	}
//   }
