let fs = require('fs')
let appendFile = require('fs')
const getPathToFolder = require('./getPathToFolder')
let path = require('path')

module.exports = function logWords(wordLine) {
    let nameFile = 'log-words.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`

    fs.appendFile(pathFile, wordLine + '\r\n', (err) => {
        if (!err) {
        } else {
            console.log(err)
        }
    })
}
