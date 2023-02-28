let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = function dictionaryTextFromFile(nameFile) {
    nameFile = 'allWords.txt'
    let path = getPathToFolder("data/")

    try {
        const data = fs.readFileSync(`${path}${nameFile}`, 'utf8')
        console.log(data)
        return data
    } catch (err) {
        console.error(`err_readFileSync in  :   ${path}${nameFile}`)
        // console.error(err)
    }
}
