const axios = require('axios')
const {
    source_language,
    target_language,
} = require('../constants/languages.js')
const refreshTokenIAM = require('./refreshTokenIAM')

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const request_retry = async (url, body, headers, n) => {
    try {
        const response = await axios.post(url, body, headers)
        const translate = response.data.translations[0].text
        return translate
    } catch (err) {
        console.log('catch_error request_retry :>> ')
        if (n <= 1) throw err
        await sleep(1000)
        const newToken = refreshTokenIAM()
        console.log('newToken :>> ', newToken)
        newToken.then((res) => {
            console.log('res :>> ', res)
        })
        headers = { headers: { Authorization: `Bearer ${newToken}` } }
        return request_retry(url, body, headers, n - 1)
    }
}

module.exports = async function translateText(texts, IAM_TOKEN) {
    const body = {
        sourceLanguageCode: source_language,
        targetLanguageCode: target_language,
        texts: texts,
        folderId: process.env.folder_id,
    }

    const headers = { headers: { Authorization: `Bearer ${IAM_TOKEN}` } }
    const url = 'https://translate.api.cloud.yandex.net/translate/v2/translate'

    let translate
    try {
        translate = await request_retry(url, body, headers, 60)
    } catch (err) {
        console.log('yandex_api_ERROR_translate: ')
        console.error(err)
    }
    return translate
}
