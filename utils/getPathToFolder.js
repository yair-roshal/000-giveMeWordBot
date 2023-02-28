module.exports = function getPathToFolder(folder) {
    if (process.env.NODE_ENV === 'dev') {
        return `/Users/yair/Desktop/dev/000-giveMeWordBot/${folder}/`
    }

    if (process.env.NODE_ENV === 'prod') {
        return `${folder}`
        // return '../data/logs/'
    }
}
