const bcrypt = require('bcryptjs')

exports.hashPassword = function hashPassword(password) {
    return bcrypt.hashSync(password)
}

exports.verifyPassword = function compareHash(password, hashPassword) {
    return bcrypt.compareSync(password, hashPassword)
}

exports.ObjectID = /^[0-9a-fA-F]{24}$/i

exports.generatePaging = (skipPage = 0, limit = 1, total = 0) => {
    const skip = parseInt(skipPage || '0') * limit
    const totalPage = Math.ceil(total / limit)
    const currentPage = skip < total ? skipPage + 1 : -1

    return {
        currentPage,
        totalPage,
        limit,
    }
}
