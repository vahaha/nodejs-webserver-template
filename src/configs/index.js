/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({
    path: path.join(__dirname, `../../env/${process.env.NODE_ENV}.env`),
})

dotenv.config({
    path: path.join(__dirname, '../../env/default.env'),
})
