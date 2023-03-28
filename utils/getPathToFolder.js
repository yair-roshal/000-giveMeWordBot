let path = require('path')

module.exports = function getPathToFolder(folder) {
    if (process.env.NODE_ENV === 'dev') {
        return path.join(__dirname, `../${folder}`)
    }

    if (process.env.NODE_ENV === 'prod') {
        console.log('prod!!!')
        // console.log('__dirname', __dirname)
        // console.log('`../${folder}`', `../${folder}`)
        return path.join(__dirname, `../${folder}`)
    }
}
