const translateText = require('./translateText')
const getIamToken = require('./getIamToken')
const logWords = require('../utils/logWords')
const formatDate = require('./formatDate.js')

const dotenv = require('dotenv')
dotenv.config()

module.exports = async function prepareMessage(
    response,
    randomIndex,
    wordLineDictionary,
    isOneWord,
    firstEnglishWord,
    dictionaryLength,
) {
    let responseData
    if (response != undefined && isOneWord) {
        responseData = response.data

        return getIamToken().then(async function (token) {
            console.log('token === ', !!token)

            let examples = ''
            for (const key0 in responseData[0].meanings) {
                for (const key in responseData[0].meanings[key0].definitions) {
                    if (
                        responseData[0].meanings[key0].definitions[key]
                            .example != undefined
                    ) {
                        examples +=
                            '\r\n' +
                            `- ${responseData[0].meanings[key0].definitions[key].example}`
                        // console.log(
                        //     'text_for_translate : ',
                        //     responseData[0].meanings[key0].definitions[key].example,
                        // )
                        await translateText(
                            responseData[0].meanings[key0].definitions[key]
                                .example,
                            token,
                        )
                            .then((translateTextVar) => {
                                // console.log('translateTextVar222', translateTextVar)
                                if (translateTextVar)
                                    examples +=
                                        '\r\n' + '-' + translateTextVar + '\r\n'
                            })
                            .catch((err) =>
                                console.log('err_translateText() : ', err),
                            )
                    }
                }
            }
            let phonetic = ''
            for (const key in responseData[0].phonetics) {
                if (responseData[0].phonetics[key].text != undefined) {
                    phonetic = responseData[0].phonetics[key].text
                }
            }

            let audio

            for (const key in responseData[0].phonetics) {
                if (responseData[0].phonetics[key].audio != undefined) {
                    audio = responseData[0].phonetics[key].audio
                }
            }

            if (!audio) {
                audio = `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${firstEnglishWord}&tl=en&client=tw-ob`
            }

            let phoneticLine = phonetic //pronunciation
                ? `${phonetic} - `
                : responseData[0] && responseData[0].phonetic
                ? `${responseData[0] && responseData[0].phonetic} - `
                : ''
            phoneticLine = isOneWord ? phoneticLine : ''

            let exampleLine = examples && isOneWord ? `${examples}` : ''

            let audioLine =
                audio && isOneWord && responseData[0]
                    ? `${audio}`
                    : responseData[0].phonetics[1] &&
                      responseData[0].phonetics[1].audio
                    ? `${
                          responseData[0].phonetics[1] &&
                          responseData[0].phonetics[1].audio
                      }`
                    : ''

            linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstEnglishWord}`

            const timestamp = Date.now()
            const formattedDate = formatDate(timestamp)

            console.log(
                'timestamp, formattedDate :>> ',
                timestamp,
                ' - ',
                formattedDate,
            )

            let logMessage =
                `${randomIndex + 1}.${wordLineDictionary}  -  ` + formattedDate
            logWords(logMessage)

            return `<b>_______________________________</b>
${process.env.NODE_ENV === 'prod' ? '' : formattedDate}
<b>${randomIndex + 1}/(${dictionaryLength}) 
${phoneticLine}${wordLineDictionary} </b>
${exampleLine}
<a href="${audioLine}">   </a>
<a href="${linkToTranslate}">See on Context</a>`
        })
    } else {
        return `<b>_______________________________</b>
${process.env.NODE_ENV === 'prod' ? '' : formattedDate}
<b>${randomIndex + 1}/(${dictionaryLength}) 
${wordLineDictionary} </b>`
    }
}
