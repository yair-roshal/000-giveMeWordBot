const ms = 1000
const sec = 60

let min = 0.1 //6sec
// const min = 1 // 1min
// const min = 10 // 10min
// const min = 30 // 30min

if (process.env.NODE_ENV === 'dev') {
    min = 0.1 //6sec
}
if (process.env.NODE_ENV === 'prod') {
    // min = 10 // 10min
    min = 60 // 60min
}

let interval = min * sec * ms

module.exports = { ms, sec, min, interval }
