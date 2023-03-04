let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')

module.exports = function dictionaryTextFromFile() {
    let nameFile = 'allWords.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`
    console.log('pathFile4444', pathFile)
    //  checkExistFile(pathFile)

    try {
        const data = fs.readFileSync(pathFile, 'utf8')
        // console.log('data999', data)
        return data
    } catch (err) {
        console.error(
            `err_readFileSync in  :    ${pathFile}`,
            // err,
        )
    }
}
