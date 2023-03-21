module.exports = {
    apps: [
        {
            name: 'engBot',
            script: 'server.js',
            watch: true,
            ignore_watch: ['*.txt', 'data/', 'data/cache_allWords.txt'],
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
