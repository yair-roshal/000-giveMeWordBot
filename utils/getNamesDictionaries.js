const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')

module.exports = getNamesDictionaries = () => {
    const pathToFolder = getPathToFolder('data/dictionaries/')
    try {
        return fs.readdirSync(pathToFolder)
    } catch (err) {
        console.error('Error reading dictionaries directory:', err)
        return []
    }
}
