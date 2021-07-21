const Router = require('@koa/router')

const { load: loadRoutes } = require('../../libs/router')
const { protect } = require('../../www/middleware')

const router = new Router({ prefix: '/protected' })

router.use(
    protect({
        whiteList: [
            '/protected/login',
            // 'POST /protected/users',
            // /^\/protected\/(facebook|zalo).*/,
        ],
    }),
)

loadRoutes(`${__dirname}/*/**/*endpoint.js`, router)

router.get('/', ctx => {
    ctx.body = {
        text: 'Ok',
    }
})

// only exports route | array of routes | loadRoutes
exports.loadRoutes = loadRoutes(`${__dirname}/*/**/*endpoint.js`, router)
