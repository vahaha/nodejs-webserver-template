const Router = require('@koa/router')
const glob = require('glob')

exports.load = (pattern, routeOption = {}) => {
    const router =
        routeOption instanceof Router ? routeOption : new Router(routeOption)

    // load routes
    return new Promise((resolve, reject) => {
        glob(
            pattern,
            // { ignore: '**/auth/*endpoint.js' },
            async (err, matches) => {
                if (err) {
                    reject(err)
                }

                for (let i = 0; i < matches.length; i += 1) {
                    const file = matches[i]
                    const controller = require(file) // eslint-disable-line global-require
                    const routers = Array.isArray(controller)
                        ? controller
                        : [controller]
                    for (let i = 0; i < routers.length; i += 1) {
                        let item = routers[i]
                        if (item.loadRoutes) {
                            item = await routers[i].loadRoutes
                        }
                        router.use(item.routes()).use(item.allowedMethods())
                    }
                }

                resolve(router)
            },
        )
    })
}
