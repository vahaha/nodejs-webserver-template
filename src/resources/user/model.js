const debug = require('../../libs/debug')(__filename)
const { ValidationError } = require('../../libs/errors')

const generator = require('generate-password')
const UserSchema = require('./schema-mg')
const UserCache = require('./cache')
const { STATUS } = require('./static')

/**
 * Get list of users in paging mode
 * @param Number skip
 * @param Number limit
 * @param Object filter object: {status}
 * @returns array of user
 * @returns
 */
exports.fetch = async (skip = 0, limit = 20, filter = {}) => {
    const users = await UserSchema.find(filter).skip(skip).limit(limit).lean()
    return users
}

/**
 * Get user profile by id
 * @param {*} id
 * @returns
 */
exports.get = async id => {
    const user = await UserSchema.findOne({ _id: id }).lean()
    return user
}

/**
 * Get user profile by email
 * @param {*} email
 * @returns
 */
exports.getByEmail = async email => {
    return await UserSchema.findOne({ email }).lean()
}

/**
 * Create a new user
 * @param {*} user
 * @returns
 */
exports.create = async user => {
    const userByEmail = await exports.getByEmail(user.email)
    if (userByEmail) {
        if (userByEmail.status === STATUS.ACTIVE) {
            throw new ValidationError('Existed user has email ' + user.email)
        }

        const result = await UserSchema.findOneAndUpdate(
            { _id: userByEmail._id },
            { ...user, status: STATUS.ACTIVE },
            { new: true },
        )

        return result.toJSON()
    }
    user.accessToken = generator.generate({
        length: 64,
        numbers: true,
    })

    const result = await UserSchema.create(user)

    return result.toJSON()
}

/**
 * update user profile by id
 * @param {*} id
 * @param {*} updatedFields
 * @returns user after updated
 */
exports.update = async (id, updatedFields) => {
    let user = await UserSchema.findByIdAndUpdate(id, updatedFields, {
        new: false,
    })

    if (user.accessToken) {
        UserCache.removeAccessToken(user.accessToken).catch(debug.error)
    }

    user = await UserSchema.findById(user._id)

    return user
}

/**
 * delete a user by id
 * @param {*} id
 * @returns
 */
exports.delete = async id => {
    let user = await UserSchema.findByIdAndUpdate(
        { _id: id },
        { status: STATUS.DELETED },
        { new: false },
    )
    if (user.accessToken) {
        UserCache.removeAccessToken(user.accessToken).catch(debug.error)
    }

    user = await UserSchema.findById(user._id)

    return user
}

exports.getTotalNumber = async (filter = {}) => {
    const total = await UserSchema.countDocuments(filter)

    return total
}

/**
 * Get user profile by id
 * @param {*} id
 * @returns
 */
exports.getFullProfile = async id => {
    const user = await UserSchema.findOne({ _id: id })
        .populate('channelAccounts')
        .lean()

    delete user.channelAccountIds

    return user
}

exports.getProfileByAccessToken = async accessToken => {
    if (!accessToken) {
        return null
    }

    const profile = await UserSchema.findOne({ accessToken })
        .populate('channelAccounts')
        .lean()

    return profile
}

exports.resetAccessToken = async userId => {
    const accessToken = generator.generate({
        length: 64,
        numbers: true,
    })

    const user = await exports.update(userId, {
        accessToken,
    })

    UserCache.removeAccessToken(accessToken).catch(debug.error)

    return user
}

exports.connectChannelAccount = async (userId, channelAccountId) => {
    return UserSchema.findByIdAndUpdate(userId, {
        $addToSet: { channelAccountIds: channelAccountId },
    })
}

exports.disconnectChannelAccount = async (userId, channelAccountId) => {
    return UserSchema.findByIdAndUpdate(userId, {
        $pull: { channelAccountIds: channelAccountId },
    })
}
