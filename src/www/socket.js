const socketio = require('socket.io')
const redis_adapter = require('socket.io-redis')
const debug = require('../libs/debug')(__filename)
const MessageListener = require('../apis/chat/message/socket-listener')
const { registerSendingMessageToGuest } = require('../platforms/web')
const ChannelService = require('../resources/channel/service')
const GuestService = require('../resources/guest/service')
const Redis = require('../connections/redis')
const {
    UnknownError,
    AuthenticationError,
    NotFoundError,
} = require('../libs/errors')

const CRITICAL_ERROR_EVENT = 'socketio-client'

exports.create = server => {
    const io = socketio(server, {
        path: process.env.SOCKET_PATH,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })

    io.adapter(
        redis_adapter({
            pubClient: Redis.getNewConnection(),
            subClient: Redis.getNewConnection(),
        }),
    )

    registerSendingMessageToGuest(io)

    io.use(verifyToken)
    io.use(checkInGuest)
    io.use(checkInSession) // always execute before authentication middleware

    io.on('connection', socket => {
        debug.log('a client connected')
        MessageListener(io, socket)
        // socket.on(events.JOIN_ROOM, room.joinRoomHandler(socket))
        // socket.on(events.LEAVE_ROOM, room.leaveRoomHandler(socket))
    })
}

const verifyToken = async (socket, next) => {
    // Authorize
    const { guestRefId, channelId, verifyToken } = socket.handshake.query

    let ok = true
    let error = new UnknownError('Unknow error')
    if (!guestRefId) {
        error = new AuthenticationError('guestRefId is required')
        ok = false
    }
    if (!channelId) {
        error = new AuthenticationError('channelId is required')
        ok = false
    }
    if (!verifyToken) {
        error = new AuthenticationError('verifyToken is required')
        ok = false
    }

    if (!ok) {
        debug.warn(error)
        socket.emit(CRITICAL_ERROR_EVENT, { error })
        socket.disconnect()

        return false
    }

    const channel = await ChannelService.get(channelId)

    if (!channel) {
        error = new AuthenticationError(`channel id ${channelId} is not found`)
        ok = false
    } else if (channel.verifyToken !== verifyToken) {
        error = new AuthenticationError(`verifyToken ${verifyToken} is invalid`)
        ok = false
    }

    if (!ok) {
        debug.warn(error)
        socket.emit(CRITICAL_ERROR_EVENT, error)
        socket.disconnect()

        return false
    }

    socket.state = socket.state || {}

    socket.state.channel = channel

    return next()
}

const checkInGuest = async (socket, next) => {
    const { guestRefId } = socket.handshake.query
    const { channel } = socket.state

    const guests = await GuestService.getByChannelIdAndRefIds(channel._id, [
        guestRefId,
    ])

    if (!guests || !guests.length) {
        const error = new NotFoundError(
            `Not found guest by channel id ${channel._id} and guest refId ${guestRefId}`,
        )
        debug.warn(error)
        socket.emit(CRITICAL_ERROR_EVENT, error)
        socket.disconnect()
    }

    const guest = guests[0]

    guest._id = guest._id.toString()

    socket.state = socket.state || {}
    socket.state.guest = guest
    socket.join(guest._id)

    return next()
}

const checkInSession = async (socket, next) => {
    socket.on('disconnect', async reason => {
        debug.log(`disconnectd by reason: ${reason}`)
    })

    socket.on('disconnecting', async reason => {
        debug.log(`disconnecting with reason: ${reason}`)
    })

    socket.on('error', error => {
        debug.error('socket error', error)
    })

    return next()
}
