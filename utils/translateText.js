const axios = require('axios')
const {
    source_language,
    target_language,
} = require('../constants/languages.js')
const logAlerts = require('./logAlerts')
const refreshTokenIAM = require('./refreshTokenIAM')

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const request_retry = async (url, body, headers, n) => {
    try {
        return await axios
            .post(
                'https://translate.api.cloud.yandex.net/translate/v2/translate',
                body,
                headers,
            )
            .then((response) => {
                translate = response.data.translations[0].text
                return translate
            })
        // .catch(async (err) => {
        //     logAlerts('yandex_api_ERROR_translate: ', err)

        //     refreshTokenIAM()
        //     console.log('yandex_api_ERROR_translate: ')
        // })
    } catch (err) {
        console.log('catch_error :>> ', err)
        if (n <= 1) throw err
        await sleep(1000)
        IAM_TOKEN = refreshTokenIAM()
        return await request_retry({ url, body, headers, n: n - 1 })
    }
}

module.exports = async function translateText(texts, IAM_TOKEN) {
    let translate
    const body = {
        sourceLanguageCode: source_language,
        targetLanguageCode: target_language,
        texts: texts,
        folderId: process.env.folder_id,
    }

    const headers = { headers: { Authorization: `Bearer ${IAM_TOKEN}` } }
    const url = 'https://translate.api.cloud.yandex.net/translate/v2/translate'

    //try 60 seconds
    translate = request_retry(url, body, headers, 60)

    // translate = await axios
    //     .post(
    //         'https://translate.api.cloud.yandex.net/translate/v2/translate',
    //         body,
    //         headers,
    //     )
    //     .then((response) => {
    //         translate = response.data.translations[0].text
    //         return translate
    //     })
    //     .catch(async (err) => {
    //         logAlerts('yandex_api_ERROR_translate: ', err)

    //         refreshTokenIAM()
    //         console.log('yandex_api_ERROR_translate: ')
    //     })

    return translate
}
