let fs = require('fs')
// let dictionaryText = require('../data/dictionaryText')
const dictionaryTextFromFile = require('./dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()
let appendFile = require('node:fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = function dictionaryTextToFile() {
    let nameFileCache = 'cache_allWords.txt'
    let path = getPathToFolder('data')

    fs.writeFile(`${path}${nameFileCache}`, dictionaryText, function (err) {
        if (err) {
            return console.log(err)
        }
        console.log(`The file was saved! With name : ${nameFileCache}`)
    })
}
