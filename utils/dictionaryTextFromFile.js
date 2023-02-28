let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = function dictionaryTextFromFile(nameFile) {
    nameFile = 'allWords.txt'
    let path = getPathToFolder('data/')

    console.log(
        'path.join(__dirname, `../${path}${nameFile}`)',
        path.join(__dirname, `../${path}${nameFile}`),
    )

    console.log(' __dirname, `)', __dirname)

    console.log('  `../${path}${nameFile}`)', `../${path}${nameFile}`)

    try {
        // var templateContent = fs.readFileSync(path.join(__dirname, '../templates') + '/my-template.html', 'utf8');

        const data = fs.readFileSync(
            path.join(__dirname, `../${path}${nameFile}`, 'utf8'),
        )

        console.log(data)
        return data
    } catch (err) {
        console.error(`err_readFileSync in  :   ${path}${nameFile}`)
        // console.error(err)
    }
}
