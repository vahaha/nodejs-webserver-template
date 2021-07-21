const Redis = require('ioredis')
const ms = require('ms')
const zlib = require('zlib')
const chalk = require('chalk')
const debug = require('../libs/debug')(__filename)

const { env } = process
const { REDIS_PREFIX: prefix } = env

const genKey = (cluster_key, primary_key) =>
    `{${prefix}/${cluster_key}}:${primary_key}`

// redis
const getNewConnection = () => {
    console.log(chalk.yellow('Connecting to Redis...'))
    const node = {
        port: env.REDIS_PORT || 6379,
        host: env.REDIS_HOST || 'localhost',
    }

    const options = {
        password: env.REDIS_PASSWORD,
    }

    if (env.REDIS_MODE === 'cluster') {
        return new Redis.Cluster([node], { redisOptions: options })
    }

    // default
    options.db = env.REDIS_DB

    return new Redis(node.port, node.host, options)
}

const redis = getNewConnection()
const publisher = getNewConnection()
const subscriber = getNewConnection()

/**
 * Get a caching, if not then execute a function and cache result
 * @param {object} options {key: "cache key", ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFn = async (
    rclient,
    { key, ttl = 60, json = false, compress = false },
    fn,
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`,
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    let cached = await rclient.get(key)
    if (!cached) {
        const result = await fn()
        if (!result) {
            return result
        }

        let val = json ? JSON.stringify(result) : result
        if (compress) {
            val = zlib.gzipSync(val).toString('base64')
        }
        rclient.set(key, val, 'EX', ttlInSecond)

        return result
    }

    if (compress) {
        cached = zlib.gunzipSync(Buffer.from(cached, 'base64')).toString('utf8')
    }
    if (json) {
        cached = JSON.parse(cached)
    }

    return cached
}

/**
 * Get a caching, if not then execute a function and cache result
 * @param {object} options {key: "cache key", field: "cache field" ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFnH = async (
    rclient,
    { key, field, ttl = 60, json = false, compress = false },
    fn,
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`,
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    const is_exists = await rclient.exists(key)
    let result = null
    if (is_exists) {
        result = await rclient.hget(key, field)
        if (result) {
            if (compress)
                result = zlib
                    .gunzipSync(Buffer.from(result, 'base64'))
                    .toString('utf8')
            if (json) result = JSON.parse(result)
        }
    }
    if (!is_exists || !result) {
        result = await Promise.resolve(fn())
        let val = json ? JSON.stringify(result) : result
        if (compress) val = zlib.gzipSync(val).toString('base64')

        rclient.hset(key, field, val)
    }
    if (!is_exists) {
        rclient.expire(key, ttlInSecond)
    }

    return result
}

redis.defineCommand('flushpattern', {
    numberOfKeys: 0,
    lua: `
        local keys = redis.call('keys', ARGV[1])
        for i=1,#keys,5000 do
            redis.call('del', unpack(keys, i, math.min(i+4999, #keys)))
        end
        return keys
    `,
})

redis.on('connect', () => {
    console.log(chalk.blue('Connected to Redis'))
})

redis.on('reconnecting', () => {
    debug.log(chalk.blue('Connected to Redis'))
})

redis.on('error', error => {
    debug.error('Occurs error on redis', error)
})

const checkConnection = () =>
    Promise.resolve(redis.status)
        .then(result =>
            result === 'ready'
                ? { connected: true }
                : { connected: false, error: result },
        )
        .catch(error => ({ connected: false, error: error.message }))

module.exports = {
    getConnection: () => redis,
    getPublisher: () => publisher,
    getSubscriber: () => subscriber,
    getNewConnection,
    genKey,
    cachedFn,
    cachedFnH,
    checkConnection,
}
