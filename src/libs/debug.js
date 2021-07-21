/* eslint-disable func-names */
const debug = require('debug')
const path = require('path')

const logger = require('./logger')
const slack = require('./slack')

function print(level, namespace, ...args) {
    const title = `app:${level}:/${namespace}`
    const writer = debug(title)
    writer(...args)
    logger.log(level === 'log' ? 'info' : level, ...args)
    if (level === 'error') {
        let strError = title
        let error
        args.forEach(e => {
            if (typeof e === 'object') {
                if (e instanceof Error) {
                    error = e
                    strError += ' ' + e.message
                    strError += '\n' + e.stack
                } else {
                    strError += ' ' + JSON.stringify(e, null, 2)
                }
            } else {
                strError += ' ' + e
            }
        })
        const message = slack.MessageTypes.Error({
            text: strError,
            error,
        })
        slack.send(message)
    }
}

/**
 * Init debug instance
 * @param String __filename the file path, which call debug
 */
function Debug(pathFile) {
    const dirname = path.dirname(pathFile)
    const filename = path.basename(pathFile, '.js')
    const absolute = path.relative(path.join(__dirname, '..'), dirname)
    const arrDir = absolute ? absolute.split(path.sep) : []
    arrDir.push(filename)
    const namespace = arrDir.join('/')

    this._namespace = `${namespace}`
    return this
}

Debug.prototype.getNamespace = function () {
    return this._namespace
}

Debug.prototype.setSubNamespace = function (sub) {
    this._namespace = `${this._namespace}/${sub}`

    return this
}

Debug.prototype.log = function (...args) {
    print('log', this._namespace, ...args)
}

Debug.prototype.info = function (...args) {
    print('info', this._namespace, ...args)
}

Debug.prototype.warn = function (...args) {
    print('warn', this._namespace, ...args)
}

Debug.prototype.error = function (...args) {
    print('error', this._namespace, ...args)
}

Debug.prototype.critical = function (...args) {
    print('critical', this._namespace, ...args)
}

module.exports = pathFile => new Debug(pathFile)
