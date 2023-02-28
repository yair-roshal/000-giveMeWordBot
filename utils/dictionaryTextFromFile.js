let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
let path = require('path');

module.exports = function dictionaryTextFromFile(nameFile) {
    nameFile = 'allWords.txt'
    let pathToFolder = getPathToFolder('data/')

    try {
        const data = fs.readFileSync(
            // path.join(__dirname, `../data`) + `${nameFile}`,
            path.join(__dirname, `../${pathToFolder}`) + `${nameFile}`,
            'utf8',
        )

        console.log(data)
        return data
    } catch (err) {
        // console.error(`err_readFileSync in  :   ${pathToFolder}${nameFile}`)
        console.error(err)
    }
}
