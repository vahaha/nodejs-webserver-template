const Koa = require('koa')
const cors = require('@koa/cors')
const koaBody = require('koa-body')
const compress = require('koa-compress')
const zlib = require('zlib')
const { koaSwagger } = require('koa2-swagger-ui')

const router = require('./router')
const { useOriginalBody } = require('./middleware')
const responseHandler = require('./response-handler')
const spec = require('../../docs/_build/index.json')

router.get(
    '/docs',
    useOriginalBody,
    koaSwagger({ routePrefix: false, swaggerOptions: { spec } }),
)

const { env } = process

const app = new Koa()

app.use(
    compress({
        filter(content_type) {
            return /text|application\/json/i.test(content_type)
        },
        threshold: 2048,
        gzip: {
            flush: zlib.Z_SYNC_FLUSH,
        },
        deflate: {
            flush: zlib.Z_SYNC_FLUSH,
        },
        br: {
            flush: zlib.Z_SYNC_FLUSH,
        },
    }),
)
app.use(env.CORS_ORIGIN ? cors({ origin: env.CORS_ORIGIN }) : cors())
app.use(
    koaBody({
        multipart: true,
        formidable: {
            uploadDir: env.UPLOAD_DIR, // directory where files will be uploaded
            keepExtensions: true, // keep file extension on upload
            multiples: true,
        },
        urlencoded: true,
        formLimit: env.FORM_LIMIT,
        jsonLimit: env.JSON_LIMIT,
    }),
)
app.use(responseHandler) // always above routes

app.use(router.routes())

module.exports = app
