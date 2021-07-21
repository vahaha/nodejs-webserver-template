const Router = require('@koa/router')
const path = require('path')

const { load: loadRoutes } = require('../libs/router')

const router = new Router()
loadRoutes(`${path.join(__dirname, '..')}/apis/*/*endpoint.js`, router)

module.exports = router
