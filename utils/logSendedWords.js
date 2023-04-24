let fs = require('fs')
let appendFile = require('fs')
const getPathToFolder = require('./getPathToFolder')
let path = require('path')

module.exports = function logSendedWords(wordLine) {
    let nameFile = 'log-words.txt'
    let pathFile = getPathToFolder('data/logs/') + `${nameFile}`
    // console.log('logSendedWords_pathFile :>> ', pathFile)
    fs.appendFile(pathFile, wordLine + '\r\n', (err) => {
        if (!err) {
        } else {
            console.log(err)
        }
    })
}
