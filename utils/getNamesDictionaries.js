const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = getNamesDictionaries = () => {
    const pathToFolder = getPathToFolder('data/dictionaries/')
    return fs.readdirSync(pathToFolder, (err, files) => {
        console.log('files :>> ', files)
        if (err) console.log(err)
        else {
            console.log(files)

            return files
        }
    })
}
