let fs = require('fs')
// let dictionaryText = require('../data/dictionaryText')
const dictionaryTextFromFile = require('./dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()
let appendFile = require('node:fs')

module.exports = function dictionaryTextToFile() {
    let nameFileCache = 'cache_allwords.txt'

    fs.writeFile(
        `/Users/yair/Desktop/dev/000-telegram-bot-english-words/data/${nameFileCache}`,
        dictionaryText,
        function (err) {
            if (err) {
                return console.log(err)
            }
            console.log(`The file was saved! With name : ${nameFileCache}`)
        },
    )
}
