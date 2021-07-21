const JWT = require('jsonwebtoken')
const debug = require('./debug')(__filename)

const verifyAccessToken = async token => {
    try {
        return JWT.verify(token, process.env.SECRET_KEY)
    } catch (e) {
        debug.warn(e.message)

        return null
    }
}

const generateAccessToken = async payload => {
    return JWT.sign(payload, process.env.SECRET_KEY, { expiresIn: '10d' })
}

module.exports = {
    verifyAccessToken,
    generateAccessToken,
}
