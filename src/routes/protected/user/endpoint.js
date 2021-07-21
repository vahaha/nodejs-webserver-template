const Router = require('@koa/router')
const {
    validateApiSchema: validate,
    checkRole,
} = require('../../../www/middleware')
const ctrl = require('./controller')
const schemas = require('./schema-api')
const { ROLE } = require('../../../resources/user/static')

const userRouter = new Router({ prefix: '/users' })

userRouter.get('/', validate(schemas.get), ctrl.fetch) // get list of users
userRouter.post('/', validate(schemas.post), ctrl.create) // create a user
userRouter.get('/:id', validate(schemas.idGet), ctrl.get) // get user by id
userRouter.put('/:id', validate(schemas.idPut), ctrl.update) // get update user by id
userRouter.del('/:id', validate(schemas.idDelete), ctrl.delete) // get delete user by id
userRouter.put(
    '/:id/password',
    checkRole(ROLE.ADMIN),
    validate(schemas.resetPassword),
    ctrl.resetPassword,
) // reset password by user id

const profileRouter = new Router({ prefix: '/profile' })

profileRouter.get('/', ctrl.getProfileOfCurrentUser)
profileRouter.put(
    '/password',
    validate(schemas.changePassword),
    ctrl.changePasswordOfCurrentUser,
)
profileRouter.get('/access-token', checkRole(ROLE.ADMIN), ctrl.getAccessToken)
profileRouter.put('/access-token', checkRole(ROLE.ADMIN), ctrl.resetAccessToken)

module.exports = [userRouter, profileRouter]
