const debug = require('../libs/debug')(__filename)
const amqp = require('amqp-connection-manager')

// Create a connetion manager
exports.connection = amqp.connect([process.env.CMC_QUEUE_URL], {
    heartbeatIntervalInSeconds: 2,
})

const connection = exports.connection

connection.on('connect', function () {
    debug.info('Connected!')
})

connection.on('disconnect', function (err) {
    debug.warn('Disconnected.', err.message, err.stack)
})
