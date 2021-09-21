// define app by environment
const appDefs = [
    {
        // node_args: [],
        env: {
            NODE_ENV: 'production',
        },
    },
    {
        // node_args: ['--inspect', '--debug=0.0.0.0:7000'],
        env: {
            NODE_ENV: 'staging',
        },
        instances: 1,
        max_memory_restart: '512M',
        node_args: '--expose-gc --max-old-space-size=512',
        exec_mode: 'cluster',
    },
]

console.log('PM2 Environment', process.env.NODE_ENV)

const apps = appDefs
    .filter(e => e.env.NODE_ENV === process.env.NODE_ENV)
    .map(appDef => ({
        name: 'api',
        script: './src/start.js',
        ...appDef,
    }))

module.exports = {
    apps,
}
