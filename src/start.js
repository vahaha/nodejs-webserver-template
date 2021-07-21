const http = require('http')
const chalk = require('chalk')
console.log(chalk.blue('Environment:'), chalk.green(process.env.NODE_ENV))

const bootstrap = require('./bootstrap')

bootstrap
    .load()
    .then(async () => {
        try {
            const { PORT } = process.env
            const app = require('./www/app')
            const socket = require('./www/socket')

            const server = http.createServer(app.callback())
            socket.create(server)

            server.listen(PORT, () =>
                console.log(
                    chalk.blue('Server is listening on port:'),
                    chalk.green(PORT),
                ),
            )
        } catch (err) {
            console.error('Occurs error when starting server\n', err)
            throw err
        }
    })
    .catch(err => {
        console.error(err)
        console.warn(chalk.yellow('Server is stopping ...'))
        process.exit(1)
    })

process.on('uncaughtException', error => {
    console.error('Uncaught Exception: ', error)
})

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})
