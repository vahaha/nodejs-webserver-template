const crypto = require('crypto')
const { redis: Redis } = require('../../connections')
const UserModel = require('./model')
const UserHelper = require('./helper')

const redis = Redis.getConnection()

const RD_TTL = '10m' // 10 minutes

const genKey = hashToken => Redis.genKey('users/token', `${hashToken}`)

exports.getProfileByAccessToken = async accessToken => {
    const hashToken = crypto
        .createHmac('sha256', process.env.JWT_SECRET_KEY)
        .update(accessToken)
        .digest('hex')
    const profile = await Redis.cachedFn(
        redis,
        {
            key: genKey(hashToken),
            ttl: RD_TTL,
            json: true,
            compress: false,
        },
        async () => {
            // get details from db
            const profile = await UserModel.getProfileByAccessToken(accessToken)
            if (profile) {
                UserHelper.protect(profile)
            }

            return profile
        },
    )

    return profile
}

exports.removeAccessToken = async accessToken => {
    const hashToken = crypto
        .createHmac('sha256', process.env.JWT_SECRET_KEY)
        .update(accessToken)
        .digest('hex')

    return redis.del(genKey(hashToken))
}
