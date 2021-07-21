const { ValidationError, NotFoundError } = require('../../libs/errors')
const { hashPassword, verifyPassword } = require('../../libs/utils')
const UserModel = require('./model')
const UserCache = require('./cache')

/**
 * Get list of users in paging mode
 * @param Number skip
 * @param Number limit
 * @param Object filter object: {status}
 * @returns array of users
 * @returns
 */
exports.fetch = async (skip = 0, limit = 20, filter) => {
    const [users, total] = await Promise.all([
        UserModel.fetch(skip, limit, filter),
        UserModel.getTotalNumber(filter),
    ])

    return { users, total }
}

/**
 * Get user profile by id
 * @param {*} id
 * @returns
 */
exports.get = async id => {
    const user = await UserModel.get(id)

    return user
}

/**
 * Get user profile by email
 * @param {*} email
 * @returns
 */
exports.getByEmail = async email => {
    const user = await UserModel.getByEmail(email)
    delete user.hashPassword

    return user
}

/**
 * Create a new user
 * @param {*} fields
 * @returns
 */
exports.create = async fields => {
    const newUser = { ...fields, hashPassword: hashPassword(fields.password) }
    delete newUser.password

    const user = await UserModel.create(newUser)
    delete user.hashPassword

    return user
}

/**
 * update user profile by id
 * @param {*} id
 * @param {*} updatedFields
 * @returns user after update
 */
exports.update = async (id, updatedFields) => {
    const user = await UserModel.update(id, updatedFields)
    delete user.hashPassword

    return user
}

/**
 * delete a user by id
 * @param {*} id
 * @returns
 */
exports.delete = async id => {
    const result = await UserModel.delete(id)
    return result
}

/**
 * change user password
 * @param {String} userId user id
 * @param {String} oldPassword old password, this is used for verify user
 * @param {String} newPassword new password
 * @returns
 */
exports.changePassword = async (userId, oldPassword, newPassword) => {
    const user = await UserModel.get(userId)

    if (!user) {
        throw new NotFoundError('Not found user by id ' + userId)
    }

    if (!verifyPassword(oldPassword, user.hashPassword)) {
        throw new ValidationError('old password is not correct')
    }

    const updatedFields = {
        hashPassword: hashPassword(newPassword),
    }

    return UserModel.update(userId, updatedFields)
}

/**
 * reset user password
 * @param {String} id user id
 * @param {String} newPassword new password
 * @returns
 */
exports.resetPassword = async (id, newPassword) => {
    const user = await UserModel.get(id)

    if (!user) {
        throw new NotFoundError('Not found user by id ' + id)
    }

    const updatedFields = {
        hashPassword: hashPassword(newPassword || process.env.PASSWORD_DEFAULT),
    }

    return UserModel.update(id, updatedFields)
}

exports.getFullProfile = async id => {
    const fullProfile = await UserModel.getFullProfile(id)

    return fullProfile
}

exports.getProfileByAccessToken = async accessToken => {
    const profile = await UserCache.getProfileByAccessToken(accessToken)

    return profile
}

exports.resetAccessToken = async userId => {
    const user = await UserModel.resetAccessToken(userId)

    if (!user) {
        throw new NotFoundError('Not found user by id ' + userId)
    }

    return user.accessToken
}
