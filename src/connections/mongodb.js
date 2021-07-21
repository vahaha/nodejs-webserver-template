const mongoose = require('mongoose')
const chalk = require('chalk')
/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
const { MONGODB_CONNECTION_STRING, MONGODB_DEFAULT_DB } = process.env
let isConnected = false

mongoose.connect(MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
})

console.log(chalk.yellow('Connecting to MongoDB...'))

const { connection: conn } = mongoose

conn.on('connected', () => {
    console.log(chalk.blue('Connected to MongoDB'))
    isConnected = true
})

conn.on('disconnected', () => {
    console.log(chalk.red('Disconnected to MongoDB'))
    isConnected = false
})

conn.on('error', console.error.bind(console, 'MongoDB connection error:'))

mongoose.Promise = global.Promise

module.exports = {
    DefaultDB: mongoose.connection.useDb(MONGODB_DEFAULT_DB),
    connection: conn,
    checkConnection: () => Promise.resolve(isConnected),
}

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log(
            'Mongoose default connection is disconnected due to application termination',
        )
    })
})
