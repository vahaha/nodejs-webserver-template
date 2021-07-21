const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const { ROLE, STATUS } = require('../../../resources/user/static')

const roles = Object.values(ROLE)
const statuses = Object.values(STATUS)

const post = {
    body: Joi.object({
        email: Joi.string().email().max(256).required(),
        password: Joi.string().min(6).max(256).required(),
        role: Joi.string().valid(...roles),
        name: Joi.string().max(256),
        phoneNumber: Joi.string().max(256),
        intro: Joi.string().max(1024),
    }),
}

const get = {
    query: Joi.object({
        skipPage: Joi.number(),
        limit: Joi.number(),
        status: Joi.string().valid(...statuses),
    }),
}

const idGet = {
    params: Joi.object({
        id: Joi.objectId(),
    }),
}

const idPut = {
    body: Joi.object({
        role: Joi.string().valid(...roles),
        name: Joi.string().max(256),
        phoneNumber: Joi.string().max(256),
        intro: Joi.string().max(1024),
        status: Joi.string().valid(...statuses),
    }),
    params: Joi.object({
        id: Joi.objectId(),
    }),
}

const idDelete = {
    params: Joi.object({
        id: Joi.objectId(),
    }),
}

const changePassword = {
    body: Joi.object({
        oldPassword: Joi.string().min(6).max(256).required(),
        newPassword: Joi.string().min(6).max(256).required(),
    }),
}

const resetPassword = {
    body: Joi.object({
        newPassword: Joi.string().min(6).max(256),
    }),
}

module.exports = {
    post,
    get,
    idGet,
    idPut,
    idDelete,
    changePassword,
    resetPassword,
}
