const { IncomingWebhook } = require('@slack/webhook')
const { name: app_name } = require('../../package.json')

const level = {
    error: 'error',
    info: 'info',
}

const { SLACK_WEBHOOK_URL, NODE_ENV } = process.env // PUT YOUR WEBHOOK URL HERE

// Initialize
const webhook = SLACK_WEBHOOK_URL && new IncomingWebhook(SLACK_WEBHOOK_URL)

// eslint-disable-next-line no-unused-vars
const Message = ({ text, method, path, request_id, sender, type, error }) => {
    const rid = request_id
    this.username = app_name.toUpperCase()
    this.icon_emoji = ':spider_web:' // User icon, you can also use custom icons here
    this.title = type
    this.blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `:spider_web: ${app_name.toLowerCase()}`,
                emoji: true,
            },
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `:desktop_computer: *${NODE_ENV || 'development'}*`,
                },
            ],
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text:
                    '```' +
                    `API:\t${method} ${path}\n` +
                    `Err:\t${(error && error.type) || 'UnknownError'}\n` +
                    `RID:\t${rid}` +
                    '```',
            },
        },
        {
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text,
                },
            ],
        },
        {
            type: 'divider',
        },
    ]

    return this
}

const MessageTypes = {
    Error: ({ text, request_id, method, path, sender, error }) =>
        Message({
            text,
            request_id,
            method,
            path,
            sender,
            type: level.error,
            error,
        }),
    Info: ({ text, request_id, method, path, sender }) =>
        Message({ text, request_id, method, path, sender, type: level.info }),
}

/**
 * Handles the actual sending request.
 * We're turning the https.request into a promise here for convenience
 * @param webhookURL
 * @param strMessage
 * @return {Promise}
 */
async function send(message) {
    if (!SLACK_WEBHOOK_URL) {
        return
    }
    // make sure the incoming message body can be parsed into valid JSON
    const result = await webhook.send(message).catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
    })

    return result
}

module.exports = {
    send,
    MessageTypes,
}
