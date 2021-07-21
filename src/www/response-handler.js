const { v4: uuidv4 } = require('uuid')
// const { AuthenticationError, ValidationError } = require('../util/error')
const debug = require('../libs/debug')(__filename)
const { NODE_ENV } = process.env

const responseHandler = (ctx, next) => {
    const request_id = uuidv4()
    ctx.request.headers['app-request-id'] = request_id
    ctx.response.set({ 'app-request-id': request_id })

    return next()
        .then(() => {
            if (ctx.status === 204) {
                ctx.status = 200
            }

            // ctx.state.originalBody is customer field
            // if true then forward original ctx.body
            const body = ctx.state.originalBody
                ? ctx.body
                : {
                      data: ctx.body,
                  }
            ctx.body = body
            if (
                NODE_ENV !== 'production' &&
                ctx.request.headers['app-debugger']
            ) {
                print('info', null, ctx)
            }
        })
        .catch(error => {
            // if (error instanceof AuthenticationError) ctx.status = 401
            // else if (error instanceof ValidationError) ctx.status = 412
            // else ctx.status = 500
            const status = parseInt(error.code)
            ctx.status = 99 < status && status < 600 ? status : 500
            ctx.body = {
                error: {
                    code: error.code,
                    message: error.message,
                    type: error.type,
                    details: error.details,
                },
            }

            print('info', error, ctx)
        })
}

module.exports = responseHandler

const print = (level = 'info', error, ctx) => {
    const request = {
        headers: { ...ctx.request.headers },
        params: ctx.params,
        query: ctx.request.query,
        body: ctx.request.body,
        request_id: ctx.request.headers['abv-request-id'],
    }
    request.headers.authorization =
        (request.headers.authorization || '').slice(0, 20) + '...'
    request.headers['x-access-token'] =
        (request.headers['x-access-token'] || '').slice(0, 20) + '...'

    const response = {
        headers: ctx.response.headers,
        body: { ...ctx.body },
    }

    if (typeof response.body.data === 'object') {
        response.body.data = { ...response.body.data }

        if (response.body.data.accessToken) {
            response.body.data.accessToken =
                response.body.data.accessToken.slice(0, 10) + '...'
        }
        if (response.body.data.token) {
            response.body.data.token =
                response.body.data.token.slice(0, 10) + '...'
        }
    } else if (typeof response.body.data === 'string') {
        response.body.data = response.body.data.slice(0, 10) + '...'
    }

    debug[level]({
        REQUEST: request,
        RESPONSE: response,
        request_id: request.request_id,
        method: ctx.request.method,
        url: ctx.request.url,
        error: error
            ? {
                  message: error.message,
                  stack: error.stack,
              }
            : error,
    })
}
