let fs = require('fs')
// let dictionaryText = require('../data/dictionaryText')
const dictionaryTextFromFile = require('./dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()
const getPathToFolder = require('./getPathToFolder')
let path = require('path')

module.exports = function dictionaryTextToFile() {
    let nameFile = 'cache_allWords.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`

    fs.writeFile(pathFile, dictionaryText, function (err) {
        if (!err) {
            console.log(`The file was saved! With name : ${nameFile}`)
        } else {
            return console.log('err4444_dictionaryTextToFile', err)
            // return console.log(err)
        }
    })
}
