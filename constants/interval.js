const ms = 1000
const sec = 60
let min = 0.1 //6sec
// const min = 1 // 1min
// const min = 10 // 10min
// const min = 30 // 30min

let clockStart = 9
let clockEnd = 22

if (process.env.NODE_ENV === 'dev') {
    // min = 0.1 //6sec
    min = 1 //1min

    clockStart = 0
    clockEnd = 24
}
if (process.env.NODE_ENV === 'prod') {
    // min = 10 // 10min
    min = 60 // 60min

    clockStart = 9
    clockEnd = 22
}

let interval = min * sec * ms

module.exports = { ms, sec, min, interval, clockStart, clockEnd }
