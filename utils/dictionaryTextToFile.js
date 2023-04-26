let fs = require('fs')
const getAllWordsFromFiles = require('./getAllWordsFromFiles.js')
const { dictionaryText } = getAllWordsFromFiles()

const getPathToFolder = require('./getPathToFolder')
const logAlerts = require('./logAlerts')

module.exports = function dictionaryTextToFile() {
    let nameFile = 'cache_allWords.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`

    fs.writeFile(pathFile, dictionaryText, function (err) {
        if (!err) {
            console.log(`The file was saved! With name : ${nameFile}`)
        } else {
            logAlerts(err)

            return console.log('err4444_dictionaryTextToFile', err)
        }
    })
}
