let fs = require('fs')
let appendFile = require('node:fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = function logWords(wordLine) {
    let nameFile = 'log-words.txt'
    let path = getPathToFolder('data/logs')

    console.log('path_logWords : ', path)

    fs.appendFile(`${path}${nameFile}`, wordLine + '\r\n', (err) => {
        if (!err) {
        } else {
            console.log(err)
        }
    })
}
