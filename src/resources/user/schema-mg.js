const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { DefaultDB } = require('../../connections/mongodb')
const { ROLE, STATUS } = require('./static')
const roles = Object.values(ROLE)
const statuses = Object.values(STATUS)

const userSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            required: true,
            auto: true,
        },
        name: String,
        role: {
            type: String,
            enum: roles,
            default: ROLE.USER,
        },
        email: {
            type: String,
            required: true,
            max: 256,
        },
        phoneNumber: String,
        hashPassword: {
            type: String,
            required: true,
        },
        accessToken: String,
        intro: String,
        status: {
            type: String,
            required: true,
            enum: statuses,
            default: STATUS.ACTIVE,
        },
        channelAccountIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ChannelAccount',
            },
        ],
    },
    { timestamps: true },
)

userSchema.virtual('channelAccounts', {
    ref: 'ChannelAccount',
    localField: 'channelAccountIds',
    foreignField: '_id',
})

module.exports = DefaultDB.model('User', userSchema, 'users')
