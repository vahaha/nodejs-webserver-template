const _ = require('lodash')
const JWT = require('jsonwebtoken')
const {
    AuthenticationError,
    ValidationError,
    ServerError,
    PermissionError,
} = require('../libs/errors')
const debug = require('../libs/debug')(__filename)
const UserService = require('../resources/user/service')

exports.validateAccessToken = async function (ctx, next) {
    const authorization = ctx.request.headers['authorization']
    const accessToken = ctx.request.headers['x-access-token']
    if (accessToken) {
        const user = await UserService.getProfileByAccessToken(accessToken)

        if (!user) {
            throw new AuthenticationError('invalid token')
        }

        ctx.state.user = user

        return next()
    }

    const payload = await decodeToken(authorization)

    // const user = await UserCache.getUserByIntId(payload.id)

    // if (!user) {
    //     const message = `User ${payload.id} not found`
    //     debug.warn(message)
    //     throw new AuthenticationError({ message })
    // }

    // debug.log(`valid token, user_id = ${user.id}`)
    // ctx.state.user = user

    ctx.state.user = payload

    return next()
}

exports.validateApiSchema = (schemas, handleLogging) => {
    return (ctx, next) => {
        const { body } = ctx.request
        const { params, query } = ctx

        const data = {
            body,
            params,
            query,
        }

        const positions = Object.keys(schemas) // [body, params, query]
        if (schemas.headers) {
            data.headers = _.pick(
                ctx.request.headers,
                Object.keys(schemas.headers),
            )
        }

        for (let i = 0; i < positions.length; i += 1) {
            const part = positions[i]
            const schema =
                typeof schemas[part] === 'function'
                    ? schemas[part](ctx)
                    : schemas[part]

            const { error } = schema.validate(data[part])
            const details = !error || error.details

            if (error) {
                if (handleLogging) {
                    handleLogging(error, ctx)
                }

                throw new ValidationError(
                    `Missing or invalid params at ${part}`,
                    null,
                    details,
                )
            }
        }

        return next()
    }
}

exports.protect = ({ whiteList = [] }) =>
    async function (ctx, next) {
        // check if path to be in white list then call next function
        for (let i = 0; i < whiteList.length; i += 1) {
            let rule = whiteList[i]

            if (rule instanceof RegExp) {
                if (rule.test(ctx.path)) {
                    return next()
                }
            } else {
                rule = rule.split(' ')
                // TODO: implement for RegExp case
                if (!rule.length) {
                    throw new ServerError('route configuration is incorrect')
                }

                const method = rule.length > 1 ? rule[0] : 'all'
                const path = rule.length > 1 ? rule[1] : rule[0]

                if (
                    (method === 'all' ||
                        method.toLowerCase() === ctx.method.toLowerCase()) &&
                    path === ctx.path
                ) {
                    return next()
                }
            }
        }
        
        return exports.validateAccessToken(ctx, next)
    }

exports.useOriginalBody = (ctx, next) => {
    ctx.state.originalBody = true
    return next()
}

exports.checkRole = role => (ctx, next) => {
    if (role !== ctx.state.user.role) {
        throw new PermissionError(
            // eslint-disable-next-line quotes
            "You don't have permission to perform this action",
        )
    }

    return next()
}

const decodeToken = async accessToken => {
    if (!accessToken) {
        const message = 'Authorization is required'
        debug.warn(message)
        throw new AuthenticationError(message)
    }

    const [type, token] = accessToken.split(' ')

    if (type !== 'Bearer' || !token) {
        const message =
            'Authorization must to be in format "Authorization: Bearer [token]"'
        debug.warn(message)
        throw new AuthenticationError(message)
    }

    let payload = false

    try {
        payload = JWT.verify(token, process.env.JWT_SECRET_KEY)
    } catch (e) {
        debug.warn(e.message)
    }

    if (!payload) {
        debug.warn('invalid token')
        throw new AuthenticationError('invalid token')
    }

    return payload
}
