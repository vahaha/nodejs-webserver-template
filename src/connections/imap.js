const _ = require('lodash')
const Imap = require('imap')
const simpleParser = require('mailparser').simpleParser

const { ServerError } = require('../libs/errors')
const debug = require('../libs/debug')(__filename)

exports.createMailServer = (channel, handleEmail, signalServerAdmin) => {
    const debugChannel = `Channel {name: ${channel.name}, id: ${channel._id}}`
    const imapConfigs = _.get(channel, 'mailServerConfigs.imap', null)
    if (!imapConfigs) {
        throw new ServerError(
            `Channel ${channel._id.toString()} is not config imap`,
        )
    }
    let firstListenMail = true
    let timeout
    let reconnectionDelay = 5000

    function resetReconnectParams() {
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
            reconnectionDelay = 5000
        }
    }
    if (signalServerAdmin) {
        signalServerAdmin.on('stop', resetReconnectParams)
        signalServerAdmin.on('restart', resetReconnectParams)
        signalServerAdmin.on('start', resetReconnectParams)
    }

    debug.info('imapConfigs', imapConfigs)

    const mailServer = new Imap({
        user: imapConfigs.username,
        password: imapConfigs.password,
        host: imapConfigs.host, // 'imap.gmail.com'
        port: imapConfigs.port, // 993
        tls: imapConfigs.tls,
        tlsOptions: imapConfigs.tlsOptions,
        authTimeout: imapConfigs.authTimeout,
    })

    let uidnext = channel.mailServerConfigs.uidnext

    mailServer.once('error', function (err) {
        debug.error(`Source Server Error: ${debugChannel}, Error:`, err)
        if (mailServer.state === 'disconnected') {
            if (reconnectionDelay < 20000) {
                // looping 15 times
                timeout = setTimeout(
                    () => mailServer.connect(),
                    reconnectionDelay,
                )
                reconnectionDelay += 1000
            } else {
                debug.warn(
                    `Stop retry connect to mail server of channel ${channel._id.toString()}. Because has retried 15 times`,
                )
                reconnectionDelay = 5000
                mailServer.destroy()
            }
        }
    })

    mailServer.once('ready', function () {
        mailServer.on('mail', async numNewMsgs => {
            if (firstListenMail) {
                firstListenMail = false
                return
            }
            debug.log(`Receive ${numNewMsgs} emails on ${debugChannel}`)
            if (!uidnext) {
                return
            }

            fetchEmails(
                mailServer,
                uidnext,
                uidnext + numNewMsgs,
                channel,
                handleEmail,
            )
            uidnext += numNewMsgs
        })

        mailServer.on('expunge', seqno => {
            debug.log('expunge seqno:', seqno)
        })
    })

    mailServer.on('ready', function () {
        debug.info(`Mail server ${channel._id} is ready`)
        resetReconnectParams()
        mailServer.openBox('INBOX', true, async function (err, box) {
            if (err) {
                return debug.error(
                    `Cannot open INBOX: ${debugChannel}, Error:`,
                    err,
                )
            }
            // debug.info(`Mail server ready: ${debugChannel}, openning box`, box)

            uidnext = uidnext || box.messages.total - box.messages.new
            if (uidnext === box.uidnext) {
                return debug.info(`Done fetching all messages! ${debugChannel}`)
            }

            fetchEmails(mailServer, uidnext, '*', channel, handleEmail)

            // debug.info('emails', inspect(emails, true, null, true))
        })
        // mailServer.getBoxes((err, boxes) => {
        //     if(err) {
        //         return debug.error('Cannot get list boxes', err)
        //     }

        //     debug.info('Boxes: ', inspect(boxes, true, null, true))
        // })
        // mailServer.subscribeBox('[Gmail]/Thư đã gửi', err => debug.error(err))
    })

    mailServer.connect()
    mailServer.on('close', hadError => {
        if (hadError) {
            debug.error(`Occurs error when close mail server ${channel._id}`)
            return
        }
        debug.info(`Mail server ${channel._id} has been closed`)
    })

    mailServer.on('end', () => {
        mailServer.closeBox(error => {
            if (error) {
                debug.error(
                    `Occurs error when closeBox at server ${channel._id}`,
                )
            }
            debug.info(`Closed box at server ${channel._id}`)
        })
        debug.info(`Mail server ${channel._id} is ended`)
    })

    return mailServer
}

const fetchEmails = (
    mailServer,
    fromMail,
    toMail = '*',
    channel,
    handleEmail,
) => {
    // const f = mailServer.seq.fetch(`${fromSeq}:${toSeq}`, {
    const f = mailServer.fetch(`${fromMail}:${toMail}`, {
        // bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
        bodies: '',
        struct: true,
    })

    f.on('message', async function (msg, seqno) {
        const email = await receiveMessage(msg, seqno)
        handleEmail(channel, email).catch(error => {
            debug.error('Handle mail error:', error)
        })
    })

    f.once('error', function (err) {
        debug.error('Fetch error: ' + err)
    })

    f.once('end', function () {
        debug.info('Done fetching all messages!')
    })
}

const receiveMessage = async (msg, seqno) => {
    debug.info('Message #%d', seqno)
    const message = {}
    const headers = {}
    const email = { uid: 0, message, headers }
    const promiseReceiveBody = new Promise(resolve => {
        // eslint-disable-next-line no-unused-vars
        msg.on('body', function (stream, info) {
            let buffer = ''

            stream.on('data', function (chunk) {
                buffer += chunk.toString('utf8')
            })

            stream.once('end', async function () {
                // const headers = Imap.parseHeader(buffer)
                // debug.info('parsedMail', inspect(headers, true, null, true))
                const parsedMail = await simpleParser(buffer)
                // debug.info('parsedMail', inspect(parsedMail, true, null, true))

                message.refId = parsedMail.messageId
                message.text = parsedMail.text
                message.html = parsedMail.html
                message.textAsHtml = parsedMail.textAsHtml
                message.attachments = parsedMail.attachments
                headers.from = parsedMail.from
                headers.to = parsedMail.to
                headers.bcc = parsedMail.bcc
                headers.cc = parsedMail.cc
                headers.subject = parsedMail.subject
                headers.inReplyTo = parsedMail.inReplyTo
                headers.replyTo = parsedMail.replyTo
                headers.references = parsedMail.references
                email.sentAt = new Date(parsedMail.date)

                resolve(email)
            })
        })
    })

    const promiseReceiveAttributes = new Promise(resolve => {
        msg.on('attributes', attrs => {
            // debug.info(inspect(attrs))
            email.uid = attrs.uid
            resolve(email)
        })
    })
    // msg.on('end', () => {})

    await Promise.all([promiseReceiveBody, promiseReceiveAttributes])
    return email
}

// const createLabel = (mailServer, labelName) => {
//     mailServer.addBox(labelName, err => {})
//     debug.info('message', 'New Label or Box Created')
// }

// const getMailboxStatusByName = (mailServer, inboxName) => {
//     mailServer.status(inboxName, (err, mailbox) => {
//         debug.info('message', mailbox)
//     })
//     debug.info('message', 'Label or Box Status')
// }

// const getMailBoxLabels = mailServer => {
//     mailServer.getBoxes((error, mailbox) => {
//         debug.info('message', mailbox)
//     })
// }

// const deleteLabel = (mailServer, labelName) => {
//     mailServer.delBox(labelName, error => {})
//     debug.info('message', 'Label or Box removed')
// }
