const express = require('express')
const router = express.Router()
const localStorage = require('localStorage')

const { openAIKey } = require('../config')
const { Configuration, OpenAIApi } = require('openai')

router.all('/openai', async ({ query: { string } }, response) => {
  let keychain = ''
  let apiKey = ''
  let messages = []

  try {
    keychain = require('../config/keychain')
    if (localStorage.openAIKey) {
      apiKey = localStorage.openAIKey
    } else {
      apiKey = keychain[0]
      localStorage.setItem('openAIKey', apiKey)
    }
  } catch {
    apiKey = openAIKey
  }

  if (localStorage.messages) {
    messages = JSON.parse(localStorage.messages)
  }

  messages.push({ role: 'user', content: string })
  try {
    const configuration = new Configuration({
      apiKey
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages
    })
    messages.push(completion.data.choices[0].message)
    localStorage.setItem('messages', JSON.stringify(messages))
    response.send({
      choices: completion.data.choices
    })
  } catch (error) {
    if (['Error'].includes(error.name) && keychain) {
      let newAIKey = ''
      if (!keychain.includes(apiKey) || keychain.indexOf(apiKey) + 1 >= keychain.length) {
        newAIKey = keychain[0]
      } else {
        newAIKey = keychain[keychain.indexOf(apiKey) + 1]
      }
      localStorage.setItem('openAIKey', newAIKey)
      response.send({
        choices: [
          {
            text: error.message + `[已为您切换新的apiKey,请重新请求]`
          }
        ]
      })
    } else {
      response.send({
        choices: [{ text: error }]
      })
    }
  }
})

module.exports = router