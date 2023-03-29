let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')
const logAlerts = require('./logAlerts')

module.exports = function dictionaryTextFromFile() {
    let nameFile = 'allWords.txt'
    let pathFile = getPathToFolder('data/') + `${nameFile}`
    // console.log('pathFile4444', pathFile)
    //  checkExistFile(pathFile)

    try {
        const data = fs.readFileSync(pathFile, 'utf8')
        // console.log('data999', data)
        return data
    } catch (err) {
        logAlerts(err)

        console.error(
            
            `err_readFileSync in  :    ${pathFile}`,
            // err,
        )
    }
}
