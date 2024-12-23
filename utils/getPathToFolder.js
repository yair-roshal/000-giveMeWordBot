let path = require('path')

module.exports = function getPathToFolder(folder) {
    
    return path.join(__dirname, `../${folder}`)
    
    
    // if (process.env.NODE_ENV === 'dev') {
    //     return path.join(__dirname, `../${folder}`)
    // }

    // if (process.env.NODE_ENV === 'prod') {
    //     console.log('prod!!!')
    //     return path.join(__dirname, `../${folder}`)
    // }
}
