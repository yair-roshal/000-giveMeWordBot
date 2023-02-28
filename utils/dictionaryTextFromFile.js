let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const checkExistFile = require('./checkExistFile')
let path = require('path')

module.exports = function dictionaryTextFromFile(nameFile) {
    nameFile = 'allwords.txt'
    let pathToFolder = getPathToFolder('data/')

    let pathFile = path.join(__dirname, `../${pathToFolder}`) + `${nameFile}`
    checkExistFile(pathFile)

    try {
        const data = fs.readFileSync(pathFile, 'utf8')

        console.log(data)
        return data
    } catch (err) {
        // console.error(`err_readFileSync in  :   ${pathToFolder}${nameFile}`)
        console.error(err)
    }
}
