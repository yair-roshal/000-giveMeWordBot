let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const checkExistFile = require('./checkExistFile')
let path = require('path')

module.exports = function dictionaryTextFromFile() {
    let nameFile = 'allWords.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`

     checkExistFile(pathFile)

    try {
        const data = fs.readFileSync(pathFile, 'utf8')

        console.log(pathFile, '--- was read')
        // console.log(data)
        return data
    } catch (err) {
         console.error(
            `err_readFileSync in  :    ${pathFile}`,
            // err,
        )
    }
}
