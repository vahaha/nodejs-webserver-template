const { utils, errors } = require('../../../libs')
const { User } = require('../../../resources')

const { NotFoundError } = errors

/**
 * Get list of users in paging mode
 */
exports.fetch = async ctx => {
    const { status } = ctx.query
    const limit = parseInt(ctx.query.limit || '20')
    const skipPage = parseInt(ctx.query.skipPage || '0')
    const skip = parseInt(skipPage || '0') * limit

    const filter = {}
    if (status) {
        filter.status = status
    }

    const { users = [], total } = await User.Service.fetch(skip, limit, filter)
    users.forEach(User.Helper.protect)

    ctx.body = {
        results: users,
        paging: utils.generatePaging(skipPage, limit, total),
    }
}

/**
 * Get user profile by id
 */
exports.get = async ctx => {
    const { id } = ctx.params
    const user = await User.Service.get(id)

    if (!user) {
        throw new NotFoundError(`Not found user by id ${id}`)
    }

    User.Helper.protect(user)

    ctx.body = user
}

exports.create = async ctx => {
    const fields = ctx.request.body
    const user = await User.Service.create(fields)

    ctx.body = user
}

exports.update = async ctx => {
    const { id } = ctx.params
    const updatedFields = ctx.request.body
    const user = await User.Service.update(id, updatedFields)

    ctx.body = user
}

exports.delete = async ctx => {
    const { id } = ctx.params
    await User.Service.delete(id)

    ctx.body = 'success'
}

exports.changePasswordOfCurrentUser = async ctx => {
    const { _id } = ctx.state.user
    const { newPassword, oldPassword } = ctx.request.body

    await User.Service.changePassword(_id, oldPassword, newPassword)

    ctx.body = 'success'
}

exports.resetPassword = async ctx => {
    const { id } = ctx.params
    const { newPassword } = ctx.request.body || {}

    await User.Service.resetPassword(id, newPassword)

    ctx.body = 'success'
}

exports.getProfileOfCurrentUser = async ctx => {
    const { _id } = ctx.state.user
    const user = await User.Service.getFullProfile(_id)
    User.Helper.protect(user)

    ctx.body = user
}

exports.getAccessToken = async ctx => {
    const { _id } = ctx.state.user
    const user = await User.Service.get(_id)

    ctx.body = user.accessToken
}

exports.resetAccessToken = async ctx => {
    const { _id } = ctx.state.user
    const accessToken = await User.Service.resetAccessToken(_id)

    ctx.body = accessToken
}
