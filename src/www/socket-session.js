const debug = require('../libs/debug')(__filename)
const Redis = require('../connections/redis')

const redis = Redis.getConnection()

exports.addSession = async (key, socketId) => {
    return redis.sadd(
        Redis.genKey('sockets/guests:connections', `id:${key}`),
        socketId,
    )
}

exports.removeSession = async (key, socketId) => {
    redis
        .srem(Redis.genKey('sockets/guests:connections', `id:${key}`), socketId)
        .catch(error => {
            debug.error('Cannot remove socket session', error)
        })
}

/*
const sessionHandler = async (socket, next) => {
    const user_id = _.get(socket, 'state.user.id', null)

    if (!user_id) {
        debug.critical(new Error('Connot get user id'))
        socket.disconnect()

        return false
    }
    Promise.all([
        // await device.onConnnected(socket),
        await rclient.hset(CACHE_KEY, socket.state.user.id, socket.id),
    ])

    socket.on('disconnect', async reason => {
        // TODO: must to leave rooms !!!
        debug.log(`disconnect user: ${socket.state.user.id}\nreason: ${reason}`)
        Promise.all([
            // await device.onDisconnected(socket),
            await rclient.hdel(CACHE_KEY, user_id),
        ])
    })
    socket.on('disconnecting', async reason => {
        // TODO: must to leave rooms !!!
        debug.log(
            `disconnecting user: ${socket.state.user.id}\nreason: ${reason}`,
        )
        Promise.all([
            // await device.onDisconnected(socket),
            await rclient.hdel(CACHE_KEY, user_id),
        ])
    })

    socket.on('error', error => {
        debug.error(`error on user id${user_id}\n`, error)
    })

    return next()
}
*/
