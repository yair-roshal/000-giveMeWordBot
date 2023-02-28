let fs = require('fs')
let appendFile = require('node:fs')
const getPathToFolder = require('./getPathToFolder')
let path = require('path')

module.exports = function logWords(wordLine) {
    let nameFile = 'log-words.txt'
    let pathToFolder = getPathToFolder('data/logs/')

    console.log('pathToFolder_logWords : ', pathToFolder)

    fs.appendFile(
        // path.join(__dirname, `../${pathToFolder}${nameFile}`),
        path.join(__dirname, `../${pathToFolder}`) + `${nameFile}`,

        wordLine + '\r\n',
        (err) => {
            if (!err) {
            } else {
                console.log(err)
            }
        },
    )
}
