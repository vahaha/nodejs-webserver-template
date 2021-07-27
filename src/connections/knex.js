const knex = require('knex')

const knexConnection = knex({
    client: 'mysql2',
    connection: process.env.MYSQL_CONNECTION_STRING,
})

exports.getConnection = () => knexConnection

exports.checkConnection = () =>
    knexConnection
        .raw('select 1 as result')
        .then(() => true)
        .catch(err => {
            console.log(err)
            return false
        })
