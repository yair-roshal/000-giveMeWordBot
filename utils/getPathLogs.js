 
module.exports = function getPathLogs() {
    let path
    if (process.env.prod) {
        return (path = '../data/logs/')
    } else {
        return (path =
            '/Users/yair/Desktop/dev/000-telegram-bot-english-words/data/logs/')
    }
}
